<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260512170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Link invoices directly to animals for manual and counter-sale billing.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE factures ADD animal_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE factures ADD CONSTRAINT factures_animal_id_fkey FOREIGN KEY (animal_id) REFERENCES animaux (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_497B315E8E962C16 ON factures (animal_id)');
        $this->addSql('UPDATE factures f SET animal_id = c.animal_id FROM consultations c WHERE f.consultation_id = c.id AND f.animal_id IS NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE factures DROP CONSTRAINT factures_animal_id_fkey');
        $this->addSql('DROP INDEX IDX_497B315E8E962C16');
        $this->addSql('ALTER TABLE factures DROP animal_id');
    }
}
