<?php

namespace App\Entity;

use App\Repository\OwnerRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: OwnerRepository::class)]
#[ORM\Table(name: 'proprietaires')]
class Owner
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    private ?string $nom = null;

    #[ORM\Column(length: 100)]
    private ?string $prenom = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $telephone = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $email = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $adresse = null;

    #[ORM\Column(name: 'cree_le', type: Types::DATETIME_MUTABLE, options: ['default' => 'CURRENT_TIMESTAMP'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'consent_traitement', options: ['default' => true])]
    private ?bool $processingConsent = true;

    #[ORM\Column(name: 'consent_marketing', options: ['default' => false])]
    private ?bool $marketingConsent = false;

    #[ORM\Column(name: 'opposition_contact', options: ['default' => false])]
    private ?bool $contactOpposition = false;

    #[ORM\Column(name: 'rgpd_notes', type: Types::TEXT, nullable: true)]
    private ?string $gdprNotes = null;

    #[ORM\Column(name: 'consentement_le', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $consentAt = null;

    #[ORM\Column(name: 'anonymise_le', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $anonymizedAt = null;

    /**
     * @var Collection<int, Animal>
     */
    #[ORM\OneToMany(targetEntity: Animal::class, mappedBy: 'owner', orphanRemoval: true)]
    private Collection $animals;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->consentAt = new \DateTime();
        $this->animals = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;
        return $this;
    }

    public function getPrenom(): ?string
    {
        return $this->prenom;
    }

    public function setPrenom(string $prenom): static
    {
        $this->prenom = $prenom;
        return $this;
    }

    public function getTelephone(): ?string
    {
        return $this->telephone;
    }

    public function setTelephone(?string $telephone): static
    {
        $this->telephone = $telephone;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getAdresse(): ?string
    {
        return $this->adresse;
    }

    public function setAdresse(?string $adresse): static
    {
        $this->adresse = $adresse;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function hasProcessingConsent(): bool
    {
        return (bool) $this->processingConsent;
    }

    public function setProcessingConsent(bool $processingConsent): static
    {
        $this->processingConsent = $processingConsent;
        return $this;
    }

    public function hasMarketingConsent(): bool
    {
        return (bool) $this->marketingConsent;
    }

    public function setMarketingConsent(bool $marketingConsent): static
    {
        $this->marketingConsent = $marketingConsent;
        return $this;
    }

    public function hasContactOpposition(): bool
    {
        return (bool) $this->contactOpposition;
    }

    public function setContactOpposition(bool $contactOpposition): static
    {
        $this->contactOpposition = $contactOpposition;
        return $this;
    }

    public function getGdprNotes(): ?string
    {
        return $this->gdprNotes;
    }

    public function setGdprNotes(?string $gdprNotes): static
    {
        $this->gdprNotes = $gdprNotes;
        return $this;
    }

    public function getConsentAt(): ?\DateTimeInterface
    {
        return $this->consentAt;
    }

    public function setConsentAt(?\DateTimeInterface $consentAt): static
    {
        $this->consentAt = $consentAt;
        return $this;
    }

    public function getAnonymizedAt(): ?\DateTimeInterface
    {
        return $this->anonymizedAt;
    }

    public function setAnonymizedAt(?\DateTimeInterface $anonymizedAt): static
    {
        $this->anonymizedAt = $anonymizedAt;
        return $this;
    }

    /**
     * @return Collection<int, Animal>
     */
    public function getAnimals(): Collection
    {
        return $this->animals;
    }

    public function addAnimal(Animal $animal): static
    {
        if (!$this->animals->contains($animal)) {
            $this->animals->add($animal);
            $animal->setOwner($this);
        }

        return $this;
    }

    public function removeAnimal(Animal $animal): static
    {
        if ($this->animals->removeElement($animal)) {
            // set the owning side to null (unless already changed)
            if ($animal->getOwner() === $this) {
                $animal->setOwner(null);
            }
        }

        return $this;
    }
}
