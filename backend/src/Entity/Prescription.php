<?php

namespace App\Entity;

use App\Repository\PrescriptionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PrescriptionRepository::class)]
#[ORM\Table(name: 'ordonnances')]
class Prescription
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'consultation_id', nullable: false, onDelete: 'CASCADE')]
    private ?Consultation $consultation = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'veterinaire_id', referencedColumnName: 'id', onDelete: 'SET NULL')]
    private ?User $veterinarian = null;

    #[ORM\Column(length: 255)]
    private ?string $medicament = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $dosage = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $frequence = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $duree = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $consignes = null;

    #[ORM\Column(name: 'date_emission', type: Types::DATETIME_MUTABLE, options: ['default' => 'CURRENT_TIMESTAMP'])]
    private ?\DateTimeInterface $emittedAt = null;

    #[ORM\Column(length: 20, options: ['default' => 'pending'])]
    private ?string $statut = 'pending';

    #[ORM\Column(name: 'printed_count', options: ['default' => 0])]
    private ?int $printedCount = 0;

    #[ORM\Column(name: 'last_printed_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $lastPrintedAt = null;

    #[ORM\Column(name: 'prepared_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $preparedAt = null;

    #[ORM\Column(name: 'prepared_by', length: 255, nullable: true)]
    private ?string $preparedBy = null;

    #[ORM\Column(name: 'dispensed_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dispensedAt = null;

    #[ORM\Column(name: 'dispensed_by', length: 255, nullable: true)]
    private ?string $dispensedBy = null;

    #[ORM\Column(name: 'cancellation_reason', type: Types::TEXT, nullable: true)]
    private ?string $cancellationReason = null;

    public function __construct()
    {
        $this->emittedAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getConsultation(): ?Consultation
    {
        return $this->consultation;
    }

    public function setConsultation(?Consultation $consultation): static
    {
        $this->consultation = $consultation;
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

    public function getMedicament(): ?string
    {
        return $this->medicament;
    }

    public function setMedicament(string $medicament): static
    {
        $this->medicament = $medicament;
        return $this;
    }

    public function getDosage(): ?string
    {
        return $this->dosage;
    }

    public function setDosage(?string $dosage): static
    {
        $this->dosage = $dosage;
        return $this;
    }

    public function getFrequence(): ?string
    {
        return $this->frequence;
    }

    public function setFrequence(?string $frequence): static
    {
        $this->frequence = $frequence;
        return $this;
    }

    public function getDuree(): ?string
    {
        return $this->duree;
    }

    public function setDuree(?string $duree): static
    {
        $this->duree = $duree;
        return $this;
    }

    public function getConsignes(): ?string
    {
        return $this->consignes;
    }

    public function setConsignes(?string $consignes): static
    {
        $this->consignes = $consignes;
        return $this;
    }

    public function getEmittedAt(): ?\DateTimeInterface
    {
        return $this->emittedAt;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;
        return $this;
    }

    public function getPrintedCount(): int
    {
        return $this->printedCount ?? 0;
    }

    public function setPrintedCount(int $printedCount): static
    {
        $this->printedCount = max(0, $printedCount);
        return $this;
    }

    public function getLastPrintedAt(): ?\DateTimeInterface
    {
        return $this->lastPrintedAt;
    }

    public function setLastPrintedAt(?\DateTimeInterface $lastPrintedAt): static
    {
        $this->lastPrintedAt = $lastPrintedAt;
        return $this;
    }

    public function getPreparedAt(): ?\DateTimeInterface
    {
        return $this->preparedAt;
    }

    public function setPreparedAt(?\DateTimeInterface $preparedAt): static
    {
        $this->preparedAt = $preparedAt;
        return $this;
    }

    public function getPreparedBy(): ?string
    {
        return $this->preparedBy;
    }

    public function setPreparedBy(?string $preparedBy): static
    {
        $this->preparedBy = $preparedBy;
        return $this;
    }

    public function getDispensedAt(): ?\DateTimeInterface
    {
        return $this->dispensedAt;
    }

    public function setDispensedAt(?\DateTimeInterface $dispensedAt): static
    {
        $this->dispensedAt = $dispensedAt;
        return $this;
    }

    public function getDispensedBy(): ?string
    {
        return $this->dispensedBy;
    }

    public function setDispensedBy(?string $dispensedBy): static
    {
        $this->dispensedBy = $dispensedBy;
        return $this;
    }

    public function getCancellationReason(): ?string
    {
        return $this->cancellationReason;
    }

    public function setCancellationReason(?string $cancellationReason): static
    {
        $this->cancellationReason = $cancellationReason;
        return $this;
    }
}
