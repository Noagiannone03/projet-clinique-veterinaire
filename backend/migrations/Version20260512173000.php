<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260512173000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Persist prescription order workflow status on prescription lines.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE ordonnances ADD statut VARCHAR(20) DEFAULT 'pending' NOT NULL");
        $this->addSql('ALTER TABLE ordonnances ADD printed_count INT DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE ordonnances ADD last_printed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE ordonnances ADD prepared_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE ordonnances ADD prepared_by VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE ordonnances ADD dispensed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE ordonnances ADD dispensed_by VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE ordonnances ADD cancellation_reason TEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ordonnances DROP cancellation_reason');
        $this->addSql('ALTER TABLE ordonnances DROP dispensed_by');
        $this->addSql('ALTER TABLE ordonnances DROP dispensed_at');
        $this->addSql('ALTER TABLE ordonnances DROP prepared_by');
        $this->addSql('ALTER TABLE ordonnances DROP prepared_at');
        $this->addSql('ALTER TABLE ordonnances DROP last_printed_at');
        $this->addSql('ALTER TABLE ordonnances DROP printed_count');
        $this->addSql('ALTER TABLE ordonnances DROP statut');
    }
}
