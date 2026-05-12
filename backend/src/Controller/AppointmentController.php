<?php

namespace App\Controller;

use App\Repository\AppointmentRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/appointments', name: 'api_appointments_')]
class AppointmentController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(AppointmentRepository $appointmentRepo): JsonResponse
    {
        $appointments = $appointmentRepo->findAll();
        
        return $this->json(array_map(function($a) {
            $animal = $a->getAnimal();
            $owner = $a->getOwner();
            $vet = $a->getVeterinarian();
            
            $start = $a->getStartTime();
            $end = $a->getEndTime();
            $duration = 30;
            if ($start && $end) {
                $duration = ($end->getTimestamp() - $start->getTimestamp()) / 60;
            }

            return [
                'id' => (string)$a->getId(),
                'patientId' => $animal ? (string)$animal->getId() : '0',
                'patientName' => $animal ? $animal->getNom() : 'Inconnu',
                'ownerName' => $owner ? ($owner->getPrenom() . ' ' . $owner->getNom()) : 'Inconnu',
                'species' => $animal ? $this->mapSpecies($animal->getEspece()) : 'other',
                'date' => $start ? $start->format('Y-m-d') : '',
                'time' => $start ? $start->format('H:i') : '',
                'duration' => (int)$duration,
                'type' => $a->getMotif() ?? 'Consultation',
                'status' => $this->mapStatus($a->getStatut()),
                'veterinarian' => $vet ? $vet->getNom() : 'Dr. Martin',
                'notes' => $a->getNotes() ?? '',
            ];
        }, $appointments));
    }

    private function mapSpecies(?string $species): string
    {
        return match (strtolower($species ?? '')) {
            'chien' => 'dog',
            'chat' => 'cat',
            'oiseau' => 'bird',
            'lapin' => 'rabbit',
            default => 'other',
        };
    }

    private function mapStatus(?string $status): string
    {
        return match (strtolower($status ?? '')) {
            'confirme' => 'confirmed',
            'termine' => 'completed',
            'annule' => 'cancelled',
            default => 'scheduled',
        };
    }
}
