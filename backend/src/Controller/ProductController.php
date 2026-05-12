<?php

namespace App\Controller;

use App\Repository\ProductRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/products', name: 'api_products_')]
class ProductController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(ProductRepository $productRepo): JsonResponse
    {
        $products = $productRepo->findAll();
        
        return $this->json(array_map(fn($p) => [
            'id' => $p->getId(),
            'name' => $p->getNom(),
            'category' => $p->getCategorie(),
            'unitPrice' => $p->getUnitPrice(),
            'stock' => $p->getStockQuantity(),
            'threshold' => $p->getAlertThreshold(),
            'description' => $p->getDescription(),
        ], $products));
    }
}
