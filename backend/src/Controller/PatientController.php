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
    public function list(AnimalRepository $animalRepo): JsonResponse
    {
        $animals = $animalRepo->findAll();
        
        return $this->json(array_map(function($a) {
            $owner = $a->getOwner();
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
            ];
        }, $animals));
    }

    #[Route('/{id}', name: 'detail', methods: ['GET'])]
    public function detail(int $id, AnimalRepository $animalRepo): JsonResponse
    {
        $a = $animalRepo->find($id);
        if (!$a) {
            return $this->json(['message' => 'Patient not found'], 404);
        }

        $owner = $a->getOwner();
        
        // This would normally include medical history, vaccinations, etc.
        // For brevity in this initial implementation, I'll return the basic info + placeholders for relations
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
            'alerts' => [], // To be implemented with Vaccination/Consultation data
            'vaccinations' => [],
            'medicalHistory' => [],
        ]);
    }
}
