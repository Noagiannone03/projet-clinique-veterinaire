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
            return [
                'id' => (string)$i->getId(),
                'invoiceNumber' => 'FAC-' . $i->getId(), // Fallback if no number in DB
                'ownerName' => $owner ? ($owner->getPrenom() . ' ' . $owner->getNom()) : 'Inconnu',
                'patientName' => $consultation && $consultation->getAnimal() ? $consultation->getAnimal()->getNom() : 'N/A',
                'date' => $i->getDate() ? $i->getDate()->format('Y-m-d') : '',
                'dueDate' => $i->getDate() ? $i->getDate()->modify('+15 days')->format('Y-m-d') : '',
                'total' => (float)$i->getTotalAmount(),
                'status' => $this->mapStatus($i->getStatut(), $i->getDate()),
                'subtotal' => (float)$i->getTotalAmount() / 1.2, // Rough estimation
                'tax' => (float)$i->getTotalAmount() * 0.2,
            ];
        }, $invoices));
    }
}
