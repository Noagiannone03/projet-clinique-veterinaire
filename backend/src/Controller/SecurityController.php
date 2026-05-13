<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Entity\User;

use OpenApi\Attributes as OA;

class SecurityController extends AbstractController
{
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    #[OA\Post(
        path: '/api/login',
        summary: 'Authentification utilisateur',
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'email', type: 'string', example: 'michel.lannes@clinique-etangs.fr'),
                    new OA\Property(property: 'password', type: 'string', example: 'admin')
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Succès'),
            new OA\Response(response: 401, description: 'Identifiants invalides')
        ]
    )]
    #[OA\Tag(name: 'Auth')]
    public function login(#[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json([
                'message' => 'missing credentials',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->isActif()) {
            return $this->json([
                'message' => 'account disabled',
            ], Response::HTTP_FORBIDDEN);
        }

        return $this->json([
            'user' => [
                'id' => (string)$user->getId(),
                'name' => $user->getPrenom() . ' ' . $user->getNom(),
                'email' => $user->getEmail(),
                'role' => match($user->getRole()) {
                    'directeur' => 'director',
                    'veterinaire' => 'veterinarian',
                    'accueil' => 'assistant',
                    default => 'assistant',
                },
                'description' => $user->getDescription(),
                'icon' => $user->getIcon(),
            ],
        ]);
    }

    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): void
    {
        throw new \Exception('This should never be reached!');
    }
}
