<?php

namespace App\Controller;

use App\Repository\ProductRepository;
use App\Repository\AppointmentRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/dashboard', name: 'api_dashboard_')]
class DashboardController extends AbstractController
{
    #[Route('/stats', name: 'stats', methods: ['GET'])]
    public function getStats(ProductRepository $productRepo, AppointmentRepository $appointmentRepo): JsonResponse
    {
        // Example stats for the dashboard
        $lowStockProducts = $productRepo->createQueryBuilder('p')
            ->where('p.stockQuantity <= p.alertThreshold')
            ->getQuery()
            ->getResult();

        $todayAppointments = $appointmentRepo->createQueryBuilder('a')
            ->where('a.startTime >= :start')
            ->setParameter('start', new \DateTime('today'))
            ->getQuery()
            ->getResult();

        return $this->json([
            'low_stock_count' => count($lowStockProducts),
            'today_appointments_count' => count($todayAppointments),
            'alerts' => array_map(fn($p) => [
                'id' => $p->getId(),
                'name' => $p->getNom(),
                'stock' => $p->getStockQuantity(),
                'threshold' => $p->getAlertThreshold(),
            ], $lowStockProducts),
        ]);
    }
}
