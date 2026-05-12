<?php

namespace App\Controller;

use App\Entity\Appointment;
use App\Repository\AnimalRepository;
use App\Repository\AppointmentRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/appointments', name: 'api_appointments_')]
class AppointmentController extends AbstractController
{
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

    private function mapStatusToDb(?string $status): string
    {
        return match ($status) {
            'completed' => 'termine',
            'cancelled' => 'annule',
            'arrived', 'in-progress', 'confirmed' => 'arrive',
            default => 'prevu',
        };
    }

    private function serializeAppointment(Appointment $a): array
    {
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
            'type' => $a->getMotif() ?? 'consultation',
            'status' => $this->mapStatus($a->getStatut()),
            'veterinarian' => $vet ? $vet->getNom() : '',
            'notes' => $a->getNotes() ?? '',
        ];
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(AppointmentRepository $appointmentRepo): JsonResponse
    {
        $appointments = $appointmentRepo->findAll();
        
        return $this->json(array_map(fn($a) => $this->serializeAppointment($a), $appointments));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, AnimalRepository $animalRepo, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $data = $request->toArray();
        $animal = $animalRepo->find((int)($data['patientId'] ?? 0));
        if (!$animal) {
            return $this->json(['message' => 'Patient not found'], 404);
        }

        $duration = max(5, (int)($data['duration'] ?? 30));
        $start = new \DateTime(($data['date'] ?? date('Y-m-d')) . ' ' . ($data['time'] ?? '09:00'));
        $end = (clone $start)->modify("+{$duration} minutes");
        $appointment = (new Appointment())
            ->setAnimal($animal)
            ->setOwner($animal->getOwner())
            ->setVeterinarian($this->findVeterinarian($data['veterinarian'] ?? null, $userRepo))
            ->setMotif($data['type'] ?? 'consultation')
            ->setStartTime($start)
            ->setEndTime($end)
            ->setStatut($this->mapStatusToDb($data['status'] ?? 'scheduled'))
            ->setNotes($data['notes'] ?? null);

        $em->persist($appointment);
        $em->flush();

        return $this->json($this->serializeAppointment($appointment), 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(int $id, Request $request, AppointmentRepository $appointmentRepo, AnimalRepository $animalRepo, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $appointment = $appointmentRepo->find($id);
        if (!$appointment) {
            return $this->json(['message' => 'Appointment not found'], 404);
        }

        $data = $request->toArray();
        if (!empty($data['patientId'])) {
            $animal = $animalRepo->find((int)$data['patientId']);
            if ($animal) {
                $appointment->setAnimal($animal)->setOwner($animal->getOwner());
            }
        }
        if (array_key_exists('type', $data)) $appointment->setMotif($data['type']);
        if (array_key_exists('status', $data)) $appointment->setStatut($this->mapStatusToDb($data['status']));
        if (array_key_exists('veterinarian', $data)) $appointment->setVeterinarian($this->findVeterinarian($data['veterinarian'], $userRepo));
        if (array_key_exists('notes', $data)) $appointment->setNotes($data['notes']);

        if (array_key_exists('date', $data) || array_key_exists('time', $data) || array_key_exists('duration', $data)) {
            $currentStart = $appointment->getStartTime() ?? new \DateTime();
            $date = $data['date'] ?? $currentStart->format('Y-m-d');
            $time = $data['time'] ?? $currentStart->format('H:i');
            $duration = max(5, (int)($data['duration'] ?? (($appointment->getEndTime()?->getTimestamp() - $currentStart->getTimestamp()) / 60 ?: 30)));
            $start = new \DateTime($date . ' ' . $time);
            $appointment->setStartTime($start)->setEndTime((clone $start)->modify("+{$duration} minutes"));
        }

        $em->flush();

        return $this->json($this->serializeAppointment($appointment));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, AppointmentRepository $appointmentRepo, EntityManagerInterface $em): JsonResponse
    {
        $appointment = $appointmentRepo->find($id);
        if (!$appointment) {
            return $this->json(['message' => 'Appointment not found'], 404);
        }

        $em->remove($appointment);
        $em->flush();

        return $this->json(null, 204);
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
            'arrive' => 'arrived',
            'termine' => 'completed',
            'annule' => 'cancelled',
            default => 'scheduled',
        };
    }
}
