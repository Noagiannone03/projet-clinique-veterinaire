<?php
require 'vendor/autoload.php';
use App\Kernel;
use App\Entity\User;
use Symfony\Component\Dotenv\Dotenv;

$dotenv = new Dotenv();
$dotenv->load(__DIR__.'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'] ?? 'dev', (bool) ($_SERVER['APP_DEBUG'] ?? true));
$kernel->boot();

$container = $kernel->getContainer();
$entityManager = $container->get('doctrine')->getManager();
$userRepo = $entityManager->getRepository(User::class);

$users = $userRepo->findAll();
echo "USERS IN DATABASE:\n";
foreach ($users as $user) {
    echo sprintf("- %s (%s) [Role: %s]\n", $user->getEmail(), $user->getPrenom() . ' ' . $user->getNom(), $user->getRole());
}
