<?php

namespace App\Controller;

use App\Repository\PrescriptionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/prescription-orders', name: 'api_prescription_orders_')]
class PrescriptionOrderController extends AbstractController
{
    private function consultationIdFromOrderId(string $id): ?int
    {
        if (str_starts_with($id, 'rx-')) {
            $id = substr($id, 3);
        }

        return ctype_digit($id) ? (int)$id : null;
    }

    private function findOrderLines(string $id, PrescriptionRepository $prescriptionRepo): array
    {
        $consultationId = $this->consultationIdFromOrderId($id);
        if (!$consultationId) {
            return [];
        }

        return $prescriptionRepo->createQueryBuilder('p')
            ->andWhere('p.consultation = :consultationId')
            ->setParameter('consultationId', $consultationId)
            ->getQuery()
            ->getResult();
    }

    #[Route('/{id}/printed', name: 'printed', methods: ['POST'])]
    public function printed(string $id, PrescriptionRepository $prescriptionRepo, EntityManagerInterface $em): JsonResponse
    {
        $lines = $this->findOrderLines($id, $prescriptionRepo);
        if (!$lines) {
            return $this->json(['message' => 'Prescription order not found'], 404);
        }

        $now = new \DateTime();
        foreach ($lines as $line) {
            $line->setPrintedCount($line->getPrintedCount() + 1);
            $line->setLastPrintedAt($now);
        }
        $em->flush();

        return $this->json(['ok' => true]);
    }

    #[Route('/{id}/prepared', name: 'prepared', methods: ['POST'])]
    public function prepared(string $id, Request $request, PrescriptionRepository $prescriptionRepo, EntityManagerInterface $em): JsonResponse
    {
        $lines = $this->findOrderLines($id, $prescriptionRepo);
        if (!$lines) {
            return $this->json(['message' => 'Prescription order not found'], 404);
        }

        $data = $request->toArray();
        $now = new \DateTime();
        foreach ($lines as $line) {
            if ($line->getStatut() === 'cancelled' || $line->getStatut() === 'dispensed') {
                continue;
            }
            $line->setStatut('prepared');
            $line->setPreparedAt($now);
            $line->setPreparedBy($data['actor'] ?? null);
        }
        $em->flush();

        return $this->json(['ok' => true]);
    }

    #[Route('/{id}/dispensed', name: 'dispensed', methods: ['POST'])]
    public function dispensed(string $id, Request $request, PrescriptionRepository $prescriptionRepo, EntityManagerInterface $em): JsonResponse
    {
        $lines = $this->findOrderLines($id, $prescriptionRepo);
        if (!$lines) {
            return $this->json(['message' => 'Prescription order not found'], 404);
        }

        $data = $request->toArray();
        $now = new \DateTime();
        foreach ($lines as $line) {
            if ($line->getStatut() === 'cancelled') {
                return $this->json(['message' => 'Prescription order is cancelled'], 409);
            }
            $line->setStatut('dispensed');
            $line->setDispensedAt($now);
            $line->setDispensedBy($data['actor'] ?? null);
        }
        $em->flush();

        return $this->json(['ok' => true]);
    }

    #[Route('/{id}/cancelled', name: 'cancelled', methods: ['POST'])]
    public function cancelled(string $id, Request $request, PrescriptionRepository $prescriptionRepo, EntityManagerInterface $em): JsonResponse
    {
        $lines = $this->findOrderLines($id, $prescriptionRepo);
        if (!$lines) {
            return $this->json(['message' => 'Prescription order not found'], 404);
        }

        $data = $request->toArray();
        foreach ($lines as $line) {
            if ($line->getStatut() === 'dispensed') {
                continue;
            }
            $line->setStatut('cancelled');
            $line->setCancellationReason($data['reason'] ?? null);
        }
        $em->flush();

        return $this->json(['ok' => true]);
    }
}
