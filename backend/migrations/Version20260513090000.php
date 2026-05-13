<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260513090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add GDPR consent and privacy management fields to owners.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE proprietaires ADD consent_traitement BOOLEAN DEFAULT true NOT NULL');
        $this->addSql('ALTER TABLE proprietaires ADD consent_marketing BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE proprietaires ADD opposition_contact BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE proprietaires ADD rgpd_notes TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE proprietaires ADD consentement_le TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE proprietaires ADD anonymise_le TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('UPDATE proprietaires SET consentement_le = cree_le WHERE consentement_le IS NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE proprietaires DROP anonymise_le');
        $this->addSql('ALTER TABLE proprietaires DROP consentement_le');
        $this->addSql('ALTER TABLE proprietaires DROP rgpd_notes');
        $this->addSql('ALTER TABLE proprietaires DROP opposition_contact');
        $this->addSql('ALTER TABLE proprietaires DROP consent_marketing');
        $this->addSql('ALTER TABLE proprietaires DROP consent_traitement');
    }
}
