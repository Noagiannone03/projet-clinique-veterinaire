<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/team')]
class TeamController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    #[Route('', name: 'api_team_index', methods: ['GET'])]
    public function index(UserRepository $users): JsonResponse
    {
        $team = $users->findBy([], ['role' => 'ASC', 'nom' => 'ASC', 'prenom' => 'ASC']);

        return $this->json(array_map(fn (User $user) => $this->serializeUser($user), $team));
    }

    #[Route('', name: 'api_team_create', methods: ['POST'])]
    public function create(Request $request, UserRepository $users): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?: [];
        $validation = $this->validatePayload($data, true);

        if ($validation !== null) {
            return $validation;
        }

        $email = strtolower(trim((string) $data['email']));
        if ($users->findOneBy(['email' => $email])) {
            return $this->json(['message' => 'Un compte existe deja avec cet email.'], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user
            ->setPrenom(trim((string) $data['firstName']))
            ->setNom(trim((string) $data['lastName']))
            ->setEmail($email)
            ->setRole($this->toDatabaseRole((string) $data['role']))
            ->setDescription($this->emptyToNull($data['description'] ?? null))
            ->setIcon($this->iconForRole((string) $data['role']))
            ->setActif((bool) ($data['active'] ?? true));

        $user->setPassword($this->passwordHasher->hashPassword($user, (string) $data['password']));

        try {
            $this->entityManager->persist($user);
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json(['message' => 'Un compte existe deja avec cet email.'], Response::HTTP_CONFLICT);
        }

        return $this->json($this->serializeUser($user), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_team_update', methods: ['PUT', 'PATCH'])]
    public function update(int $id, Request $request, UserRepository $users): JsonResponse
    {
        $user = $users->find($id);
        if (!$user) {
            return $this->json(['message' => 'Compte introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true) ?: [];
        $validation = $this->validatePayload($data, false);

        if ($validation !== null) {
            return $validation;
        }

        if (array_key_exists('firstName', $data)) {
            $user->setPrenom(trim((string) $data['firstName']));
        }
        if (array_key_exists('lastName', $data)) {
            $user->setNom(trim((string) $data['lastName']));
        }
        if (array_key_exists('email', $data)) {
            $email = strtolower(trim((string) $data['email']));
            $existing = $users->findOneBy(['email' => $email]);
            if ($existing && $existing->getId() !== $user->getId()) {
                return $this->json(['message' => 'Un compte existe deja avec cet email.'], Response::HTTP_CONFLICT);
            }
            $user->setEmail($email);
        }
        if (array_key_exists('role', $data)) {
            $user->setRole($this->toDatabaseRole((string) $data['role']));
            $user->setIcon($this->iconForRole((string) $data['role']));
        }
        if (array_key_exists('description', $data)) {
            $user->setDescription($this->emptyToNull($data['description']));
        }
        if (array_key_exists('active', $data)) {
            if ($user->getRole() === 'directeur' && $data['active'] === false && $users->count(['role' => 'directeur', 'actif' => true]) <= 1) {
                return $this->json(['message' => 'Impossible de couper le dernier compte directeur actif.'], Response::HTTP_BAD_REQUEST);
            }
            $user->setActif((bool) $data['active']);
        }
        if (!empty($data['password'])) {
            $user->setPassword($this->passwordHasher->hashPassword($user, (string) $data['password']));
        }

        try {
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json(['message' => 'Un compte existe deja avec cet email.'], Response::HTTP_CONFLICT);
        }

        return $this->json($this->serializeUser($user));
    }

    private function validatePayload(array $data, bool $creating): ?JsonResponse
    {
        foreach (['firstName', 'lastName', 'email', 'role'] as $field) {
            if (($creating || array_key_exists($field, $data)) && trim((string) ($data[$field] ?? '')) === '') {
                return $this->json(['message' => 'Le champ '.$field.' est obligatoire.'], Response::HTTP_BAD_REQUEST);
            }
        }

        if (($creating || array_key_exists('email', $data)) && !filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
            return $this->json(['message' => 'Email invalide.'], Response::HTTP_BAD_REQUEST);
        }

        if (($creating || array_key_exists('role', $data)) && !in_array($data['role'] ?? '', ['director', 'veterinarian', 'assistant'], true)) {
            return $this->json(['message' => 'Role invalide.'], Response::HTTP_BAD_REQUEST);
        }

        if ($creating && trim((string) ($data['password'] ?? '')) === '') {
            return $this->json(['message' => 'Le mot de passe initial est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        return null;
    }

    private function serializeUser(User $user): array
    {
        return [
            'id' => (string) $user->getId(),
            'firstName' => $user->getPrenom(),
            'lastName' => $user->getNom(),
            'name' => trim($user->getPrenom().' '.$user->getNom()),
            'email' => $user->getEmail(),
            'role' => $this->toApiRole($user->getRole()),
            'active' => (bool) $user->isActif(),
            'description' => $user->getDescription() ?? '',
            'icon' => $user->getIcon() ?? $this->iconForRole($this->toApiRole($user->getRole())),
            'createdAt' => $user->getCreatedAt()?->format('Y-m-d H:i:s'),
        ];
    }

    private function toApiRole(?string $role): string
    {
        return match ($role) {
            'directeur' => 'director',
            'veterinaire' => 'veterinarian',
            'accueil' => 'assistant',
            default => 'assistant',
        };
    }

    private function toDatabaseRole(string $role): string
    {
        return match ($role) {
            'director' => 'directeur',
            'veterinarian' => 'veterinaire',
            default => 'accueil',
        };
    }

    private function iconForRole(string $role): string
    {
        return match ($role) {
            'director' => 'briefcase',
            'veterinarian' => 'stethoscope',
            default => 'headset',
        };
    }

    private function emptyToNull(mixed $value): ?string
    {
        $text = trim((string) ($value ?? ''));

        return $text === '' ? null : $text;
    }
}
