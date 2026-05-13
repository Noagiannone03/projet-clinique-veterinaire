<?php

namespace App\Controller;

use App\Entity\Animal;
use App\Entity\Consultation;
use App\Entity\Owner;
use App\Entity\Prescription;
use App\Entity\Vaccination;
use App\Repository\AnimalRepository;
use App\Repository\ConsultationRepository;
use App\Repository\OwnerRepository;
use App\Repository\PrescriptionRepository;
use App\Repository\UserRepository;
use App\Repository\VaccinationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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

    private function mapSpeciesToDb(?string $species): string
    {
        return match ($species) {
            'dog' => 'Chien',
            'cat' => 'Chat',
            'bird' => 'Oiseau',
            'rabbit' => 'Lapin',
            default => 'Autre',
        };
    }

    private function mapMedicalTypeToDb(?string $type): string
    {
        return match ($type) {
            'surgery' => 'Chirurgie',
            'emergency' => 'Urgence',
            'follow-up' => 'Suivi',
            default => 'Consultation',
        };
    }

    private function findVeterinarian(?string $name, UserRepository $userRepo): ?\App\Entity\User
    {
        $users = $userRepo->findBy(['role' => 'veterinaire']);
        if (!$name) {
            return $users[0] ?? null;
        }

        $needle = strtolower($name);
        foreach ($users as $user) {
            $fullName = strtolower(trim($user->getPrenom() . ' ' . $user->getNom()));
            if (str_contains($fullName, $needle) || str_contains($needle, strtolower($user->getNom()))) {
                return $user;
            }
        }

        return $users[0] ?? null;
    }

    private function serializeAnimal(Animal $a, ConsultationRepository $consultationRepo, VaccinationRepository $vaccinationRepo, PrescriptionRepository $prescriptionRepo): array
    {
        $owner = $a->getOwner();
        $consultations = $consultationRepo->findBy(['animal' => $a], ['date' => 'DESC']);
        $vaccinations = $vaccinationRepo->findBy(['animal' => $a]);

        return [
            'id' => (string)$a->getId(),
            'name' => $a->getNom(),
            'species' => $this->mapSpecies($a->getEspece()),
            'breed' => $a->getRace() ?? '',
            'birthDate' => $a->getBirthDate() ? $a->getBirthDate()->format('Y-m-d') : '',
            'weight' => (float)$a->getPoids(),
            'color' => '',
            'microchip' => '',
            'owner' => $owner ? [
                'id' => (string)$owner->getId(),
                'firstName' => $owner->getPrenom(),
                'lastName' => $owner->getNom(),
                'email' => $owner->getEmail() ?? '',
                'phone' => $owner->getTelephone() ?? '',
                'address' => $owner->getAdresse() ?? '',
                'processingConsent' => $owner->hasProcessingConsent(),
                'marketingConsent' => $owner->hasMarketingConsent(),
                'contactOpposition' => $owner->hasContactOpposition(),
                'gdprNotes' => $owner->getGdprNotes() ?? '',
                'consentAt' => $owner->getConsentAt()?->format(\DateTimeInterface::ATOM),
                'anonymizedAt' => $owner->getAnonymizedAt()?->format(\DateTimeInterface::ATOM),
            ] : null,
            'alerts' => $a->getAlerteRisque() ? [[
                'id' => 'risk',
                'type' => 'medical',
                'description' => $a->getAlerteRisque(),
                'message' => $a->getAlerteRisque(),
                'severity' => 'high',
            ]] : [],
            'vaccinations' => array_map(fn($v) => [
                'id' => (string)$v->getId(),
                'name' => $v->getType(),
                'type' => $v->getType(),
                'date' => $v->getDate()->format('Y-m-d'),
                'nextDueDate' => $v->getRecallDate() ? $v->getRecallDate()->format('Y-m-d') : '',
                'status' => $v->getStatut() ?? 'completed',
                'veterinarian' => $v->getVeterinarian() ? $v->getVeterinarian()->getNom() : '',
            ], $vaccinations),
            'medicalHistory' => array_map(function ($c) use ($prescriptionRepo) {
                $prescriptions = $prescriptionRepo->findBy(['consultation' => $c]);
                return [
                    'id' => (string)$c->getId(),
                    'date' => $c->getDate()->format('Y-m-d'),
                    'type' => 'consultation',
                    'veterinarian' => $c->getVeterinarian() ? $c->getVeterinarian()->getNom() : '',
                    'diagnosis' => $c->getDiagnostic() ?? '',
                    'treatment' => $c->getActesRealises() ?? '',
                    'notes' => $c->getObservations() ?? '',
                    'prescriptions' => array_map(fn($p) => [
                        'id' => (string)$p->getId(),
                        'medication' => $p->getMedicament(),
                        'dosage' => $p->getDosage() ?? '',
                        'frequency' => $p->getFrequence() ?? '',
                        'duration' => $p->getDuree() ?? '',
                        'instructions' => $p->getConsignes() ?? '',
                        'status' => $p->getStatut() ?? 'pending',
                        'printedCount' => $p->getPrintedCount(),
                        'lastPrintedAt' => $p->getLastPrintedAt()?->format(\DateTimeInterface::ATOM),
                        'preparedAt' => $p->getPreparedAt()?->format(\DateTimeInterface::ATOM),
                        'preparedBy' => $p->getPreparedBy(),
                        'dispensedAt' => $p->getDispensedAt()?->format(\DateTimeInterface::ATOM),
                        'dispensedBy' => $p->getDispensedBy(),
                        'cancellationReason' => $p->getCancellationReason(),
                    ], $prescriptions),
                ];
            }, $consultations),
        ];
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(summary: 'Récupérer la liste de tous les patients (animaux)')]
    public function list(
        AnimalRepository $animalRepo, 
        \App\Repository\ConsultationRepository $consultationRepo,
        \App\Repository\VaccinationRepository $vaccinationRepo,
        PrescriptionRepository $prescriptionRepo
    ): JsonResponse
    {
        $animals = $animalRepo->findAll();
        
        return $this->json(array_map(fn($a) => $this->serializeAnimal($a, $consultationRepo, $vaccinationRepo, $prescriptionRepo), $animals));
    }

    #[Route('/{id}', name: 'detail', methods: ['GET'])]
    public function detail(
        int $id, 
        AnimalRepository $animalRepo,
        \App\Repository\ConsultationRepository $consultationRepo,
        \App\Repository\VaccinationRepository $vaccinationRepo,
        PrescriptionRepository $prescriptionRepo
    ): JsonResponse
    {
        $a = $animalRepo->find($id);
        if (!$a) {
            return $this->json(['message' => 'Patient not found'], 404);
        }

        return $this->json($this->serializeAnimal($a, $consultationRepo, $vaccinationRepo, $prescriptionRepo));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em, ConsultationRepository $consultationRepo, VaccinationRepository $vaccinationRepo, PrescriptionRepository $prescriptionRepo): JsonResponse
    {
        $data = $request->toArray();
        $ownerData = $data['owner'] ?? [];

        $owner = (new Owner())
            ->setPrenom(trim($ownerData['firstName'] ?? ''))
            ->setNom(trim($ownerData['lastName'] ?? ''))
            ->setEmail($ownerData['email'] ?? null)
            ->setTelephone($ownerData['phone'] ?? null)
            ->setAdresse($ownerData['address'] ?? null)
            ->setProcessingConsent((bool)($ownerData['processingConsent'] ?? true))
            ->setMarketingConsent((bool)($ownerData['marketingConsent'] ?? false))
            ->setContactOpposition((bool)($ownerData['contactOpposition'] ?? false))
            ->setGdprNotes($ownerData['gdprNotes'] ?? null)
            ->setConsentAt(new \DateTime());

        $animal = (new Animal())
            ->setOwner($owner)
            ->setNom(trim($data['name'] ?? 'Nouveau patient'))
            ->setEspece($this->mapSpeciesToDb($data['species'] ?? null))
            ->setRace($data['breed'] ?? null)
            ->setBirthDate(!empty($data['birthDate']) ? new \DateTime($data['birthDate']) : null)
            ->setPoids(isset($data['weight']) ? number_format((float)$data['weight'], 2, '.', '') : null);

        $em->persist($owner);
        $em->persist($animal);
        $em->flush();

        return $this->json($this->serializeAnimal($animal, $consultationRepo, $vaccinationRepo, $prescriptionRepo), 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(int $id, Request $request, AnimalRepository $animalRepo, EntityManagerInterface $em, ConsultationRepository $consultationRepo, VaccinationRepository $vaccinationRepo, PrescriptionRepository $prescriptionRepo): JsonResponse
    {
        $animal = $animalRepo->find($id);
        if (!$animal) {
            return $this->json(['message' => 'Patient not found'], 404);
        }

        $data = $request->toArray();
        if (array_key_exists('name', $data)) $animal->setNom(trim($data['name']) ?: $animal->getNom());
        if (array_key_exists('species', $data)) $animal->setEspece($this->mapSpeciesToDb($data['species']));
        if (array_key_exists('breed', $data)) $animal->setRace($data['breed']);
        if (array_key_exists('birthDate', $data)) $animal->setBirthDate($data['birthDate'] ? new \DateTime($data['birthDate']) : null);
        if (array_key_exists('weight', $data)) $animal->setPoids(number_format((float)$data['weight'], 2, '.', ''));
        if (array_key_exists('alerts', $data)) {
            $firstAlert = $data['alerts'][0] ?? null;
            $animal->setAlerteRisque($firstAlert['description'] ?? $firstAlert['message'] ?? null);
        }

        if (isset($data['owner']) && $animal->getOwner()) {
            $owner = $animal->getOwner();
            if (array_key_exists('firstName', $data['owner'])) $owner->setPrenom($data['owner']['firstName']);
            if (array_key_exists('lastName', $data['owner'])) $owner->setNom($data['owner']['lastName']);
            if (array_key_exists('email', $data['owner'])) $owner->setEmail($data['owner']['email']);
            if (array_key_exists('phone', $data['owner'])) $owner->setTelephone($data['owner']['phone']);
            if (array_key_exists('address', $data['owner'])) $owner->setAdresse($data['owner']['address']);
            if (array_key_exists('processingConsent', $data['owner'])) $owner->setProcessingConsent((bool)$data['owner']['processingConsent'])->setConsentAt(new \DateTime());
            if (array_key_exists('marketingConsent', $data['owner'])) $owner->setMarketingConsent((bool)$data['owner']['marketingConsent']);
            if (array_key_exists('contactOpposition', $data['owner'])) $owner->setContactOpposition((bool)$data['owner']['contactOpposition']);
            if (array_key_exists('gdprNotes', $data['owner'])) $owner->setGdprNotes($data['owner']['gdprNotes'] ?: null);
        }

        $em->flush();

        return $this->json($this->serializeAnimal($animal, $consultationRepo, $vaccinationRepo, $prescriptionRepo));
    }

    #[Route('/{id}/gdpr', name: 'gdpr_update', methods: ['PATCH'])]
    public function updateGdpr(int $id, Request $request, AnimalRepository $animalRepo, EntityManagerInterface $em, ConsultationRepository $consultationRepo, VaccinationRepository $vaccinationRepo, PrescriptionRepository $prescriptionRepo): JsonResponse
    {
        $animal = $animalRepo->find($id);
        if (!$animal || !$animal->getOwner()) {
            return $this->json(['message' => 'Patient not found'], 404);
        }

        $data = $request->toArray();
        $owner = $animal->getOwner();

        if (array_key_exists('processingConsent', $data)) {
            $owner->setProcessingConsent((bool)$data['processingConsent'])->setConsentAt(new \DateTime());
        }
        if (array_key_exists('marketingConsent', $data)) {
            $owner->setMarketingConsent((bool)$data['marketingConsent']);
        }
        if (array_key_exists('contactOpposition', $data)) {
            $owner->setContactOpposition((bool)$data['contactOpposition']);
        }
        if (array_key_exists('gdprNotes', $data)) {
            $owner->setGdprNotes(trim((string)$data['gdprNotes']) ?: null);
        }

        $em->flush();

        return $this->json($this->serializeAnimal($animal, $consultationRepo, $vaccinationRepo, $prescriptionRepo));
    }

    #[Route('/{id}/gdpr-export', name: 'gdpr_export', methods: ['GET'])]
    public function exportGdpr(int $id, AnimalRepository $animalRepo, ConsultationRepository $consultationRepo, VaccinationRepository $vaccinationRepo, PrescriptionRepository $prescriptionRepo): JsonResponse
    {
        $animal = $animalRepo->find($id);
        if (!$animal) {
            return $this->json(['message' => 'Patient not found'], 404);
        }

        return $this->json([
            'exportedAt' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            'format' => 'json',
            'scope' => 'owner_and_patient_record',
            'retentionNotice' => 'Certaines donnees liees aux obligations comptables ou au suivi medical peuvent etre conservees selon les durees applicables.',
            'data' => $this->serializeAnimal($animal, $consultationRepo, $vaccinationRepo, $prescriptionRepo),
        ]);
    }

    #[Route('/{id}/anonymize-owner', name: 'owner_anonymize', methods: ['POST'])]
    public function anonymizeOwner(int $id, AnimalRepository $animalRepo, EntityManagerInterface $em, ConsultationRepository $consultationRepo, VaccinationRepository $vaccinationRepo, PrescriptionRepository $prescriptionRepo): JsonResponse
    {
        $animal = $animalRepo->find($id);
        if (!$animal || !$animal->getOwner()) {
            return $this->json(['message' => 'Patient not found'], 404);
        }

        $owner = $animal->getOwner();
        $owner
            ->setPrenom('Client')
            ->setNom('Anonymise '.$owner->getId())
            ->setEmail(null)
            ->setTelephone(null)
            ->setAdresse(null)
            ->setMarketingConsent(false)
            ->setContactOpposition(true)
            ->setGdprNotes('Coordonnees anonymisees a la demande du client.')
            ->setAnonymizedAt(new \DateTime());

        $em->flush();

        return $this->json($this->serializeAnimal($animal, $consultationRepo, $vaccinationRepo, $prescriptionRepo));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, AnimalRepository $animalRepo, EntityManagerInterface $em): JsonResponse
    {
        $animal = $animalRepo->find($id);
        if (!$animal) {
            return $this->json(['message' => 'Patient not found'], 404);
        }

        $em->remove($animal);
        $em->flush();

        return $this->json(null, 204);
    }

    #[Route('/{id}/medical-records', name: 'medical_record_create', methods: ['POST'])]
    public function createMedicalRecord(int $id, Request $request, AnimalRepository $animalRepo, UserRepository $userRepo, EntityManagerInterface $em, ConsultationRepository $consultationRepo, VaccinationRepository $vaccinationRepo, PrescriptionRepository $prescriptionRepo): JsonResponse
    {
        $animal = $animalRepo->find($id);
        if (!$animal) {
            return $this->json(['message' => 'Patient not found'], 404);
        }

        $data = $request->toArray();
        $consultation = (new Consultation())
            ->setAnimal($animal)
            ->setVeterinarian($this->findVeterinarian($data['veterinarian'] ?? null, $userRepo))
            ->setMotif($this->mapMedicalTypeToDb($data['type'] ?? null))
            ->setDiagnostic($data['diagnosis'] ?? null)
            ->setActesRealises($data['treatment'] ?? null)
            ->setObservations($data['notes'] ?? null)
            ->setDate(!empty($data['date']) ? new \DateTime($data['date']) : new \DateTime());

        $em->persist($consultation);
        foreach (($data['prescriptions'] ?? []) as $prescriptionData) {
            if (empty($prescriptionData['medication'])) continue;
            $prescription = (new Prescription())
                ->setConsultation($consultation)
                ->setVeterinarian($consultation->getVeterinarian())
                ->setMedicament($prescriptionData['medication'])
                ->setDosage($prescriptionData['dosage'] ?? null)
                ->setFrequence($prescriptionData['frequency'] ?? null)
                ->setDuree($prescriptionData['duration'] ?? null)
                ->setConsignes($prescriptionData['instructions'] ?? null);
            $em->persist($prescription);
        }
        $em->flush();

        return $this->json($this->serializeAnimal($animal, $consultationRepo, $vaccinationRepo, $prescriptionRepo));
    }

    #[Route('/{id}/vaccinations', name: 'vaccination_create', methods: ['POST'])]
    public function createVaccination(int $id, Request $request, AnimalRepository $animalRepo, UserRepository $userRepo, EntityManagerInterface $em, ConsultationRepository $consultationRepo, VaccinationRepository $vaccinationRepo, PrescriptionRepository $prescriptionRepo): JsonResponse
    {
        $animal = $animalRepo->find($id);
        if (!$animal) {
            return $this->json(['message' => 'Patient not found'], 404);
        }

        $data = $request->toArray();
        $vaccination = (new Vaccination())
            ->setAnimal($animal)
            ->setVeterinarian($this->findVeterinarian($data['veterinarian'] ?? null, $userRepo))
            ->setType($data['name'] ?? $data['type'] ?? 'Vaccin')
            ->setDate(!empty($data['date']) ? new \DateTime($data['date']) : new \DateTime())
            ->setRecallDate(!empty($data['nextDueDate']) ? new \DateTime($data['nextDueDate']) : null)
            ->setStatut($data['status'] ?? 'à jour');

        $em->persist($vaccination);
        $em->flush();

        return $this->json($this->serializeAnimal($animal, $consultationRepo, $vaccinationRepo, $prescriptionRepo));
    }
}
