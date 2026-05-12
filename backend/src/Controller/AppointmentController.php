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
        
        return $this->json(array_map(fn($a) => [
            'id' => $a->getId(),
            'animal' => $a->getAnimal() ? $a->getAnimal()->getNom() : null,
            'owner' => $a->getOwner() ? ($a->getOwner()->getPrenom() . ' ' . $a->getOwner()->getNom()) : null,
            'vet' => $a->getVeterinarian() ? $a->getVeterinarian()->getNom() : null,
            'motif' => $a->getMotif(),
            'start' => $a->getStartTime()->format('Y-m-d H:i'),
            'end' => $a->getEndTime()->format('Y-m-d H:i'),
            'status' => $a->getStatut(),
        ], $appointments));
    }
}
