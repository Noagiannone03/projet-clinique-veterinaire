<?php

namespace App\Entity;

use App\Repository\VaccinationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: VaccinationRepository::class)]
#[ORM\Table(name: 'vaccinations')]
class Vaccination
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'animal_id', nullable: false, onDelete: 'CASCADE')]
    private ?Animal $animal = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'veterinaire_id', referencedColumnName: 'id', onDelete: 'SET NULL')]
    private ?User $veterinarian = null;

    #[ORM\Column(name: 'type_vaccin', length: 100)]
    private ?string $type = null;

    #[ORM\Column(name: 'date_vaccination', type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(name: 'date_rappel', type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $recallDate = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $statut = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAnimal(): ?Animal
    {
        return $this->animal;
    }

    public function setAnimal(?Animal $animal): static
    {
        $this->animal = $animal;
        return $this;
    }

    public function getVeterinarian(): ?User
    {
        return $this->veterinarian;
    }

    public function setVeterinarian(?User $veterinarian): static
    {
        $this->veterinarian = $veterinarian;
        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): static
    {
        $this->date = $date;
        return $this;
    }

    public function getRecallDate(): ?\DateTimeInterface
    {
        return $this->recallDate;
    }

    public function setRecallDate(?\DateTimeInterface $recallDate): static
    {
        $this->recallDate = $recallDate;
        return $this;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(?string $statut): static
    {
        $this->statut = $statut;
        return $this;
    }
}
