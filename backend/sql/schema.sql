-- ============================================================
-- ÉTAPE 2 : Schéma de la base de données - Clinique Vétérinaire
-- Compatible PostgreSQL
-- ============================================================
-- COMMENT UTILISER CE FICHIER :
-- Exécute-le APRÈS avoir créé la base avec clinique_veterinaire.sql
-- Commande : psql -d clinique_veterinaire -f schema.sql
-- ============================================================
 
-- ⚠️  On supprime les tables existantes avant de les recréer
-- (utile pour repartir de zéro en développement)
-- L'ordre inverse des dépendances est important pour éviter les erreurs
 
DROP TABLE IF EXISTS lignes_facture CASCADE;
DROP TABLE IF EXISTS factures CASCADE;
DROP TABLE IF EXISTS produits CASCADE;
DROP TABLE IF EXISTS vaccinations CASCADE;
DROP TABLE IF EXISTS ordonnances CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS rendez_vous CASCADE;
DROP TABLE IF EXISTS animaux CASCADE;
DROP TABLE IF EXISTS proprietaires CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;
 
 
-- ============================================================
-- TABLE : utilisateurs
-- ============================================================
-- Contient TOUT le personnel de la clinique.
-- Les 3 rôles disponibles :
--   • directeur  → accès complet à tout
--   • veterinaire → accès : patients, planning, ordonnances, stock
--   • accueil    → accès : rendez-vous, facturation, propriétaires
--
-- ✅ Pour ajouter un employé via ta plateforme web, ton application
--    fera simplement un INSERT dans cette table.
--    Aucun besoin de toucher la base de données manuellement.
--
-- ⚠️  SÉCURITÉ : le champ mot_de_passe doit stocker un HASH (mot de
--    passe chiffré), jamais le mot de passe en clair.
--    Utilise bcrypt côté serveur avant d'insérer. Voir seed.sql.
-- ============================================================
 
CREATE TABLE utilisateurs (
    id            SERIAL PRIMARY KEY,
    nom           VARCHAR(100)  NOT NULL,
    prenom        VARCHAR(100)  NOT NULL,
    email         VARCHAR(255)  UNIQUE NOT NULL,
    mot_de_passe  VARCHAR(255)  NOT NULL,  -- stocker un hash bcrypt ici, jamais le mot de passe brut
    role          VARCHAR(20)   NOT NULL CHECK (role IN ('directeur', 'veterinaire', 'accueil')),
    actif         BOOLEAN       DEFAULT TRUE,  -- permet de désactiver un compte sans le supprimer
    cree_le       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
 
 
-- ============================================================
-- TABLE : proprietaires
-- ============================================================
-- Les clients de la clinique (propriétaires des animaux).
-- Un propriétaire peut avoir plusieurs animaux.
-- ============================================================
 
CREATE TABLE proprietaires (
    id         SERIAL PRIMARY KEY,
    nom        VARCHAR(100) NOT NULL,
    prenom     VARCHAR(100) NOT NULL,
    telephone  VARCHAR(20),
    email      VARCHAR(255),
    adresse    TEXT,
    cree_le    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 
 
-- ============================================================
-- TABLE : animaux
-- ============================================================
-- Chaque animal est lié à un propriétaire (proprietaire_id).
-- ON DELETE CASCADE : si le propriétaire est supprimé,
-- ses animaux sont supprimés aussi automatiquement.
-- ============================================================
 
CREATE TABLE animaux (
    id               SERIAL PRIMARY KEY,
    proprietaire_id  INTEGER      NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
    nom              VARCHAR(100) NOT NULL,
    espece           VARCHAR(50)  NOT NULL,
    race             VARCHAR(100),
    sexe             CHAR(1)      CHECK (sexe IN ('M', 'F')),
    date_naissance   DATE,
    poids            DECIMAL(5,2),
    allergies        TEXT,
    comportement     TEXT,
    alerte_risque    TEXT         -- ex: "Mordeur", "Stressé en consultation"
);
 
 
-- ============================================================
-- TABLE : rendez_vous
-- ============================================================
-- Représente les créneaux dans l'agenda (vu dans "Planning.A").
--
-- ⚠️  CORRECTION apportée : veterinaire_id était NOT NULL avec
--    ON DELETE SET NULL — c'est contradictoire.
--    On a retiré le NOT NULL pour permettre que le vétérinaire
--    soit mis à NULL si son compte est supprimé.
--    En pratique, ton application devrait interdire la suppression
--    d'un vétérinaire qui a des rendez-vous à venir.
-- ============================================================
 
CREATE TABLE rendez_vous (
    id                SERIAL PRIMARY KEY,
    animal_id         INTEGER  NOT NULL REFERENCES animaux(id) ON DELETE CASCADE,
    proprietaire_id   INTEGER  NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
    veterinaire_id    INTEGER           REFERENCES utilisateurs(id) ON DELETE SET NULL,  -- peut devenir NULL si le vétérinaire est supprimé
    motif             TEXT     NOT NULL,
    date_heure_debut  TIMESTAMP NOT NULL,
    date_heure_fin    TIMESTAMP NOT NULL,
    statut            VARCHAR(20) NOT NULL CHECK (statut IN ('prevu', 'arrive', 'termine', 'annule')),
    notes             TEXT,
    CONSTRAINT chk_date_fin CHECK (date_heure_fin > date_heure_debut)
);
 
 
-- ============================================================
-- TABLE : consultations
-- ============================================================
-- Créée pendant ou après un rendez-vous par le vétérinaire.
-- Contient les observations médicales, diagnostic, actes réalisés.
-- Même correction que rendez_vous pour veterinaire_id.
-- ============================================================
 
CREATE TABLE consultations (
    id                  SERIAL PRIMARY KEY,
    animal_id           INTEGER   NOT NULL REFERENCES animaux(id) ON DELETE CASCADE,
    veterinaire_id      INTEGER            REFERENCES utilisateurs(id) ON DELETE SET NULL,
    rendez_vous_id      INTEGER            REFERENCES rendez_vous(id) ON DELETE SET NULL,
    motif               TEXT,
    observations        TEXT,
    diagnostic          TEXT,
    actes_realises      TEXT,
    date_consultation   TIMESTAMP NOT NULL
);
 
 
-- ============================================================
-- TABLE : ordonnances
-- ============================================================
-- Ordonnances liées à une consultation.
-- Chaque ligne = un médicament prescrit.
-- Visible dans "Ordonnance.A" de la maquette.
-- ============================================================
 
CREATE TABLE ordonnances (
    id               SERIAL PRIMARY KEY,
    consultation_id  INTEGER       NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    veterinaire_id   INTEGER                REFERENCES utilisateurs(id) ON DELETE SET NULL,
    medicament       VARCHAR(255)  NOT NULL,
    dosage           VARCHAR(100),
    frequence        VARCHAR(100),
    duree            VARCHAR(50),
    consignes        TEXT,
    date_emission    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
 
 
-- ============================================================
-- TABLE : vaccinations
-- ============================================================
-- Suivi des vaccins passés et à venir (rappels).
-- Affiché dans "Résumé patient" de la maquette.
-- ============================================================
 
CREATE TABLE vaccinations (
    id                SERIAL PRIMARY KEY,
    animal_id         INTEGER      NOT NULL REFERENCES animaux(id) ON DELETE CASCADE,
    veterinaire_id    INTEGER               REFERENCES utilisateurs(id) ON DELETE SET NULL,
    type_vaccin       VARCHAR(100) NOT NULL,
    date_vaccination  DATE         NOT NULL,
    date_rappel       DATE,
    statut            VARCHAR(50)           -- ex: 'à jour', 'rappel requis', 'expiré'
);
 
 
-- ============================================================
-- TABLE : produits
-- ============================================================
-- Médicaments et produits en stock (page "Stock" de la maquette).
-- seuil_alerte : quand quantite_stock descend en dessous,
-- une alerte est générée (visible dans le tableau de bord).
-- ============================================================
 
CREATE TABLE produits (
    id               SERIAL PRIMARY KEY,
    nom              VARCHAR(255)  NOT NULL,
    categorie        VARCHAR(100),
    prix_unitaire    DECIMAL(10,2) NOT NULL CHECK (prix_unitaire >= 0),
    quantite_stock   INTEGER       NOT NULL DEFAULT 0 CHECK (quantite_stock >= 0),
    seuil_alerte     INTEGER       NOT NULL DEFAULT 0 CHECK (seuil_alerte >= 0),
    description      TEXT
);
 
 
-- ============================================================
-- TABLE : factures
-- ============================================================
-- Factures visibles dans la page "Facturation" de la maquette.
-- Une facture est liée à un propriétaire et optionnellement
-- à une consultation (ou vente comptoir sans consultation).
-- ============================================================
 
CREATE TABLE factures (
    id               SERIAL PRIMARY KEY,
    proprietaire_id  INTEGER       NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
    consultation_id  INTEGER                REFERENCES consultations(id) ON DELETE SET NULL,
    montant_total    DECIMAL(10,2) NOT NULL CHECK (montant_total >= 0),
    montant_paye     DECIMAL(10,2) DEFAULT 0 CHECK (montant_paye >= 0),
    statut           VARCHAR(20)   NOT NULL CHECK (statut IN ('paye', 'impaye', 'partiel')),
    mode_paiement    VARCHAR(50),  -- ex: 'carte', 'espèces', 'virement'
    date_facture     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    notes            TEXT
);
 
 
-- ============================================================
-- TABLE : lignes_facture
-- ============================================================
-- Détail de chaque facture : actes médicaux + produits vendus.
-- Chaque ligne a une description, une quantité, un prix unitaire.
-- ============================================================
 
CREATE TABLE lignes_facture (
    id             SERIAL PRIMARY KEY,
    facture_id     INTEGER       NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    produit_id     INTEGER                REFERENCES produits(id) ON DELETE SET NULL,  -- NULL si c'est un acte (pas un produit)
    description    TEXT          NOT NULL,  -- ex: "Consultation", "Carprodyl 50g", "Hospitalisation 24h"
    quantite       INTEGER       NOT NULL CHECK (quantite > 0),
    prix_unitaire  DECIMAL(10,2) NOT NULL CHECK (prix_unitaire >= 0),
    sous_total     DECIMAL(10,2) NOT NULL CHECK (sous_total >= 0)
);
 
 
-- ============================================================
-- INDEX (pour accélérer les recherches fréquentes)
-- ============================================================
-- Les index accélèrent les requêtes sur les colonnes souvent
-- utilisées dans les filtres (WHERE) ou les jointures (JOIN).
 
CREATE INDEX idx_animaux_proprietaire_id       ON animaux(proprietaire_id);
CREATE INDEX idx_rendez_vous_animal_id         ON rendez_vous(animal_id);
CREATE INDEX idx_rendez_vous_proprietaire_id   ON rendez_vous(proprietaire_id);
CREATE INDEX idx_rendez_vous_veterinaire_id    ON rendez_vous(veterinaire_id);
CREATE INDEX idx_consultations_animal_id       ON consultations(animal_id);
CREATE INDEX idx_consultations_veterinaire_id  ON consultations(veterinaire_id);
CREATE INDEX idx_consultations_rdv_id          ON consultations(rendez_vous_id);
CREATE INDEX idx_ordonnances_consultation_id   ON ordonnances(consultation_id);
CREATE INDEX idx_ordonnances_veterinaire_id    ON ordonnances(veterinaire_id);
CREATE INDEX idx_vaccinations_animal_id        ON vaccinations(animal_id);
CREATE INDEX idx_vaccinations_veterinaire_id   ON vaccinations(veterinaire_id);
CREATE INDEX idx_factures_proprietaire_id      ON factures(proprietaire_id);
CREATE INDEX idx_factures_consultation_id      ON factures(consultation_id);
CREATE INDEX idx_lignes_facture_facture_id     ON lignes_facture(facture_id);
CREATE INDEX idx_lignes_facture_produit_id     ON lignes_facture(produit_id);