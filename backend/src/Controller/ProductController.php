<?php

namespace App\Controller;

use App\Entity\Product;
use App\Repository\ProductRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/products', name: 'api_products_')]
class ProductController extends AbstractController
{
    private function mapCategoryToApi(?string $category): string
    {
        return match (strtolower($category ?? '')) {
            'médicament', 'medicament', 'medication' => 'medication',
            'alimentation', 'food' => 'food',
            'accessoire', 'accessory' => 'accessory',
            'hygiène', 'hygiene' => 'hygiene',
            'supplément', 'supplement' => 'supplement',
            default => 'medication',
        };
    }

    private function mapCategoryToDb(?string $category): string
    {
        return match ($category) {
            'food' => 'Alimentation',
            'accessory' => 'Accessoire',
            'hygiene' => 'Hygiène',
            'supplement' => 'Supplément',
            default => 'Médicament',
        };
    }

    private function serializeProduct(Product $p): array
    {
        return [
            'id' => (string)$p->getId(),
            'name' => $p->getNom(),
            'category' => $this->mapCategoryToApi($p->getCategorie()),
            'price' => (float)$p->getUnitPrice(),
            'stock' => (int)$p->getStockQuantity(),
            'minStock' => (int)$p->getAlertThreshold(),
            'description' => $p->getDescription() ?? '',
            'unit' => 'unité',
            'sku' => 'PROD-' . str_pad((string)$p->getId(), 4, '0', STR_PAD_LEFT),
            'supplier' => '',
        ];
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(ProductRepository $productRepo): JsonResponse
    {
        $products = $productRepo->findAll();
        
        return $this->json(array_map(fn($p) => $this->serializeProduct($p), $products));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = $request->toArray();

        $product = (new Product())
            ->setNom(trim($data['name'] ?? 'Nouveau produit'))
            ->setCategorie($this->mapCategoryToDb($data['category'] ?? null))
            ->setUnitPrice(number_format((float)($data['price'] ?? 0), 2, '.', ''))
            ->setStockQuantity(max(0, (int)($data['stock'] ?? 0)))
            ->setAlertThreshold(max(0, (int)($data['minStock'] ?? 0)))
            ->setDescription($data['description'] ?? null);

        $em->persist($product);
        $em->flush();

        return $this->json($this->serializeProduct($product), 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(int $id, Request $request, ProductRepository $productRepo, EntityManagerInterface $em): JsonResponse
    {
        $product = $productRepo->find($id);
        if (!$product) {
            return $this->json(['message' => 'Product not found'], 404);
        }

        $data = $request->toArray();
        if (array_key_exists('name', $data)) $product->setNom(trim($data['name']) ?: $product->getNom());
        if (array_key_exists('category', $data)) $product->setCategorie($this->mapCategoryToDb($data['category']));
        if (array_key_exists('price', $data)) $product->setUnitPrice(number_format((float)$data['price'], 2, '.', ''));
        if (array_key_exists('stock', $data)) $product->setStockQuantity(max(0, (int)$data['stock']));
        if (array_key_exists('minStock', $data)) $product->setAlertThreshold(max(0, (int)$data['minStock']));
        if (array_key_exists('description', $data)) $product->setDescription($data['description']);

        $em->flush();

        return $this->json($this->serializeProduct($product));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, ProductRepository $productRepo, EntityManagerInterface $em): JsonResponse
    {
        $product = $productRepo->find($id);
        if (!$product) {
            return $this->json(['message' => 'Product not found'], 404);
        }

        $em->remove($product);
        $em->flush();

        return $this->json(null, 204);
    }
}
