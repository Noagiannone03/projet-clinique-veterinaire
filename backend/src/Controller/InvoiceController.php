<?php

namespace App\Controller;

use App\Entity\Invoice;
use App\Entity\InvoiceLine;
use App\Entity\Owner;
use App\Repository\AnimalRepository;
use App\Repository\InvoiceRepository;
use App\Repository\ProductRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/invoices', name: 'api_invoices_')]
class InvoiceController extends AbstractController
{
    private function mapStatus(string $status, \DateTimeInterface $date): string
    {
        if ($status === 'paye') return 'paid';
        if ($status === 'partiel') return 'partial';
        
        $today = new \DateTime('today');
        if ($date < $today) return 'overdue';
        
        return 'pending';
    }

    private function mapStatusToDb(string $status): string
    {
        return match ($status) {
            'paid' => 'paye',
            'partial' => 'partiel',
            default => 'impaye',
        };
    }

    private function mapPaymentModeToDb(?string $method): ?string
    {
        return match ($method) {
            'cash' => 'espèces',
            'check' => 'cheque',
            'transfer' => 'virement',
            'card' => 'carte',
            default => $method,
        };
    }

    private function mapPaymentModeToApi(?string $method): string
    {
        return match ($method) {
            'espèces' => 'cash',
            'cheque' => 'check',
            'virement' => 'transfer',
            'carte' => 'card',
            default => $method ?: 'card',
        };
    }

    private function serializeInvoice(Invoice $i): array
    {
        $owner = $i->getOwner();
        $consultation = $i->getConsultation();
        $animal = $i->getAnimal() ?? $consultation?->getAnimal();
        $lines = array_map(function($line) {
            return [
                'id' => (string)$line->getId(),
                'description' => $line->getDescription(),
                'quantity' => $line->getQuantite(),
                'unitPrice' => (float)$line->getUnitPrice(),
                'total' => (float)$line->getSubTotal(),
                'lineType' => $line->getProduct() ? 'product' : 'service',
                'productId' => $line->getProduct() ? (string)$line->getProduct()->getId() : null,
            ];
        }, $i->getLines()->toArray());

        if (empty($lines)) {
            $lines = [[
                'id' => 'fallback',
                'description' => 'Prestation de soin / Consultation',
                'quantity' => 1,
                'unitPrice' => (float)$i->getTotalAmount(),
                'total' => (float)$i->getTotalAmount(),
                'lineType' => 'service',
            ]];
        }

        $date = $i->getDate() ?? new \DateTime();
        $paidAmount = (float)$i->getPaidAmount();

        return [
            'id' => (string)$i->getId(),
            'invoiceNumber' => 'FAC-' . str_pad((string)$i->getId(), 6, '0', STR_PAD_LEFT),
            'ownerName' => $owner ? ($owner->getPrenom() . ' ' . $owner->getNom()) : 'Inconnu',
            'patientName' => $animal ? $animal->getNom() : 'N/A',
            'patientId' => $animal ? (string)$animal->getId() : '0',
            'date' => $date->format('Y-m-d'),
            'dueDate' => (clone $date)->modify('+15 days')->format('Y-m-d'),
            'total' => (float)$i->getTotalAmount(),
            'status' => $this->mapStatus($i->getStatut(), $date),
            'subtotal' => round((float)$i->getTotalAmount() / 1.2, 2),
            'tax' => round((float)$i->getTotalAmount() - ((float)$i->getTotalAmount() / 1.2), 2),
            'source' => $consultation ? 'consultation' : 'manual',
            'lines' => $lines,
            'payments' => $paidAmount > 0 ? [[
                'id' => 'paid-' . $i->getId(),
                'invoiceId' => (string)$i->getId(),
                'amount' => $paidAmount,
                'method' => $this->mapPaymentModeToApi($i->getPaymentMode()),
                'date' => $date->format('Y-m-d'),
            ]] : [],
            'paymentPlan' => null,
        ];
    }

    private function replaceLines(Invoice $invoice, array $linesData, ProductRepository $productRepo): float
    {
        foreach ($invoice->getLines()->toArray() as $line) {
            $invoice->removeLine($line);
        }

        $total = 0.0;
        foreach ($linesData as $lineData) {
            $quantity = max(1, (int)($lineData['quantity'] ?? 1));
            $unitPrice = (float)($lineData['unitPrice'] ?? 0);
            $subTotal = $quantity * $unitPrice;
            $line = (new InvoiceLine())
                ->setDescription($lineData['description'] ?? 'Ligne de facture')
                ->setQuantite($quantity)
                ->setUnitPrice(number_format($unitPrice, 2, '.', ''))
                ->setSubTotal(number_format($subTotal, 2, '.', ''));
            if (!empty($lineData['productId'])) {
                $line->setProduct($productRepo->find((int)$lineData['productId']));
            }
            $invoice->addLine($line);
            $total += $subTotal;
        }

        return $total;
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(InvoiceRepository $invoiceRepo): JsonResponse
    {
        $invoices = $invoiceRepo->findAll();
        
        return $this->json(array_map(fn($i) => $this->serializeInvoice($i), $invoices));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, AnimalRepository $animalRepo, ProductRepository $productRepo, EntityManagerInterface $em): JsonResponse
    {
        $data = $request->toArray();
        $animal = !empty($data['patientId']) ? $animalRepo->find((int)$data['patientId']) : null;
        $owner = $animal?->getOwner();
        if (!$owner) {
            $parts = preg_split('/\s+/', trim($data['ownerName'] ?? 'Client inconnu'), 2);
            $owner = (new Owner())->setPrenom($parts[0] ?? 'Client')->setNom($parts[1] ?? 'inconnu');
            $em->persist($owner);
        }

        $invoice = (new Invoice())
            ->setOwner($owner)
            ->setAnimal($animal)
            ->setPaidAmount('0.00')
            ->setPaymentMode(null)
            ->setStatut('impaye')
            ->setNotes($data['notes'] ?? null)
            ->setDate(!empty($data['date']) ? new \DateTime($data['date']) : new \DateTime());

        $total = $this->replaceLines($invoice, $data['lines'] ?? [], $productRepo);
        $invoice->setTotalAmount(number_format($total, 2, '.', ''));
        $invoice->setStatut($this->mapStatusToDb($data['status'] ?? 'pending'));

        $em->persist($invoice);
        $em->flush();

        return $this->json($this->serializeInvoice($invoice), 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(int $id, Request $request, InvoiceRepository $invoiceRepo, ProductRepository $productRepo, EntityManagerInterface $em): JsonResponse
    {
        $invoice = $invoiceRepo->find($id);
        if (!$invoice) {
            return $this->json(['message' => 'Invoice not found'], 404);
        }

        $data = $request->toArray();
        if (array_key_exists('date', $data) && $data['date']) $invoice->setDate(new \DateTime($data['date']));
        if (array_key_exists('status', $data)) $invoice->setStatut($this->mapStatusToDb($data['status']));
        if (array_key_exists('lines', $data)) {
            $total = $this->replaceLines($invoice, $data['lines'], $productRepo);
            $invoice->setTotalAmount(number_format($total, 2, '.', ''));
        }

        $em->flush();

        return $this->json($this->serializeInvoice($invoice));
    }

    #[Route('/{id}/payments', name: 'payment_create', methods: ['POST'])]
    public function recordPayment(int $id, Request $request, InvoiceRepository $invoiceRepo, EntityManagerInterface $em): JsonResponse
    {
        $invoice = $invoiceRepo->find($id);
        if (!$invoice) {
            return $this->json(['message' => 'Invoice not found'], 404);
        }

        $data = $request->toArray();
        $total = (float)$invoice->getTotalAmount();
        $paid = (float)$invoice->getPaidAmount();
        $amount = max(0, (float)($data['amount'] ?? 0));
        $newPaid = min($total, $paid + $amount);

        $invoice->setPaidAmount(number_format($newPaid, 2, '.', ''));
        $invoice->setPaymentMode($this->mapPaymentModeToDb($data['method'] ?? null));
        $invoice->setStatut($newPaid >= $total ? 'paye' : ($newPaid > 0 ? 'partiel' : 'impaye'));

        $em->flush();

        return $this->json($this->serializeInvoice($invoice));
    }
}
