<?php

namespace App\Controller;

use App\Repository\AnimalRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use OpenApi\Attributes as OA;

#[Route('/api/patients', name: 'api_patients_')]
#[OA\Tag(name: 'Patients')]
class PatientController extends AbstractController
{
    private function mapSpecies(string $species): string
    {
        return match (strtolower($species)) {
            'chien' => 'dog',
            'chat' => 'cat',
            'oiseau' => 'bird',
            'lapin' => 'rabbit',
            default => 'other',
        };
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(summary: 'Récupérer la liste de tous les patients (animaux)')]
    public function list(
        AnimalRepository $animalRepo, 
        \App\Repository\ConsultationRepository $consultationRepo,
        \App\Repository\VaccinationRepository $vaccinationRepo
    ): JsonResponse
    {
        $animals = $animalRepo->findAll();
        
        return $this->json(array_map(function($a) use ($consultationRepo, $vaccinationRepo) {
            $owner = $a->getOwner();
            
            // Fetch real data for relations
            $consultations = $consultationRepo->findBy(['animal' => $a], ['date' => 'DESC']);
            $vaccinations = $vaccinationRepo->findBy(['animal' => $a]);

            return [
                'id' => (string)$a->getId(),
                'name' => $a->getNom(),
                'species' => $this->mapSpecies($a->getEspece()),
                'breed' => $a->getRace() ?? '',
                'birthDate' => $a->getBirthDate() ? $a->getBirthDate()->format('Y-m-d') : '',
                'weight' => (float)$a->getPoids(),
                'owner' => $owner ? [
                    'id' => (string)$owner->getId(),
                    'firstName' => $owner->getPrenom(),
                    'lastName' => $owner->getNom(),
                    'email' => $owner->getEmail() ?? '',
                    'phone' => $owner->getTelephone() ?? '',
                    'address' => $owner->getAdresse() ?? '',
                ] : null,
                'alerts' => $a->getAlerteRisque() ? [['id' => 'a1', 'type' => 'medical', 'message' => $a->getAlerteRisque(), 'severity' => 'high']] : [],
                'vaccinations' => array_map(fn($v) => [
                    'id' => (string)$v->getId(),
                    'type' => $v->getType(),
                    'date' => $v->getDate()->format('Y-m-d'),
                    'nextDueDate' => $v->getRecallDate() ? $v->getRecallDate()->format('Y-m-d') : '',
                    'status' => $v->getStatut() ?? 'completed',
                ], $vaccinations),
                'medicalHistory' => array_map(fn($c) => [
                    'id' => (string)$c->getId(),
                    'date' => $c->getDate()->format('Y-m-d'),
                    'type' => 'Consultation',
                    'veterinarian' => $c->getVeterinarian() ? $c->getVeterinarian()->getNom() : 'Dr. Martin',
                    'diagnosis' => $c->getDiagnostic() ?? '',
                    'notes' => $c->getObservations() ?? '',
                    'prescriptions' => [], // To be implemented with Prescription entity
                ], $consultations),
            ];
        }, $animals));
    }

    #[Route('/{id}', name: 'detail', methods: ['GET'])]
    public function detail(
        int $id, 
        AnimalRepository $animalRepo,
        \App\Repository\ConsultationRepository $consultationRepo,
        \App\Repository\VaccinationRepository $vaccinationRepo
    ): JsonResponse
    {
        $a = $animalRepo->find($id);
        if (!$a) {
            return $this->json(['message' => 'Patient not found'], 404);
        }

        $owner = $a->getOwner();
        $consultations = $consultationRepo->findBy(['animal' => $a], ['date' => 'DESC']);
        $vaccinations = $vaccinationRepo->findBy(['animal' => $a]);
        
        return $this->json([
            'id' => (string)$a->getId(),
            'name' => $a->getNom(),
            'species' => $this->mapSpecies($a->getEspece()),
            'breed' => $a->getRace() ?? '',
            'birthDate' => $a->getBirthDate() ? $a->getBirthDate()->format('Y-m-d') : '',
            'weight' => (float)$a->getPoids(),
            'owner' => $owner ? [
                'id' => (string)$owner->getId(),
                'firstName' => $owner->getPrenom(),
                'lastName' => $owner->getNom(),
                'email' => $owner->getEmail() ?? '',
                'phone' => $owner->getTelephone() ?? '',
                'address' => $owner->getAdresse() ?? '',
            ] : null,
            'alerts' => $a->getAlerteRisque() ? [['id' => 'a1', 'type' => 'medical', 'message' => $a->getAlerteRisque(), 'severity' => 'high']] : [],
            'vaccinations' => array_map(fn($v) => [
                'id' => (string)$v->getId(),
                'type' => $v->getType(),
                'date' => $v->getDate()->format('Y-m-d'),
                'nextDueDate' => $v->getRecallDate() ? $v->getRecallDate()->format('Y-m-d') : '',
                'status' => $v->getStatut() ?? 'completed',
            ], $vaccinations),
            'medicalHistory' => array_map(fn($c) => [
                'id' => (string)$c->getId(),
                'date' => $c->getDate()->format('Y-m-d'),
                'type' => 'Consultation',
                'veterinarian' => $c->getVeterinarian() ? $c->getVeterinarian()->getNom() : 'Dr. Martin',
                'diagnosis' => $c->getDiagnostic() ?? '',
                'notes' => $c->getObservations() ?? '',
                'prescriptions' => [],
            ], $consultations),
        ]);
    }
}
