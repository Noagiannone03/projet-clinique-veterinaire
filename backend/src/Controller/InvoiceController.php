<?php

namespace App\Controller;

use App\Repository\InvoiceRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
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

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(InvoiceRepository $invoiceRepo): JsonResponse
    {
        $invoices = $invoiceRepo->findAll();
        
        return $this->json(array_map(function($i) {
            $owner = $i->getOwner();
            $consultation = $i->getConsultation();
            
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

            // If no lines in DB, provide the fallback default line
            if (empty($lines)) {
                $lines = [[
                    'id' => 'fallback',
                    'description' => 'Prestation de soin / Consultation',
                    'quantity' => 1,
                    'unitPrice' => (float)$i->getTotalAmount(),
                    'total' => (float)$i->getTotalAmount(),
                    'lineType' => 'service'
                ]];
            }

            return [
                'id' => (string)$i->getId(),
                'invoiceNumber' => 'FAC-' . str_pad($i->getId(), 6, '0', STR_PAD_LEFT),
                'ownerName' => $owner ? ($owner->getPrenom() . ' ' . $owner->getNom()) : 'Inconnu',
                'patientName' => $consultation && $consultation->getAnimal() ? $consultation->getAnimal()->getNom() : 'N/A',
                'patientId' => $consultation && $consultation->getAnimal() ? (string)$consultation->getAnimal()->getId() : '0',
                'date' => $i->getDate() ? $i->getDate()->format('Y-m-d') : '',
                'dueDate' => $i->getDate() ? $i->getDate()->modify('+15 days')->format('Y-m-d') : '',
                'total' => (float)$i->getTotalAmount(),
                'status' => $this->mapStatus($i->getStatut(), $i->getDate()),
                'subtotal' => (float)$i->getTotalAmount() / 1.2,
                'tax' => (float)$i->getTotalAmount() * 0.2,
                'source' => $consultation ? 'consultation' : 'manual',
                'lines' => $lines,
                'payments' => $i->getPaidAmount() > 0 ? [[
                    'id' => 'p1',
                    'amount' => (float)$i->getPaidAmount(),
                    'method' => $i->getPaymentMode() ?: 'card',
                    'date' => $i->getDate() ? $i->getDate()->format('Y-m-d') : '',
                ]] : [],
                'paymentPlan' => null,
            ];
        }, $invoices));
    }
}
