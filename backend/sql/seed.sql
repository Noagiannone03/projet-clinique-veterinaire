-- ============================================================
-- ÉTAPE 3 : Données de test (seed.sql)
-- À exécuter APRÈS schema.sql
-- ============================================================
-- ⚠️  IMPORTANT SUR LES MOTS DE PASSE :
--
-- En développement, on met des mots de passe en clair pour tester.
-- En production (site accessible par des utilisateurs réels),
-- tu NE DOIS JAMAIS stocker un mot de passe en clair.
--
-- Ce qu'il faut faire côté serveur (Node.js, Python, etc.) :
--   1. L'utilisateur entre son mot de passe
--   2. Ton serveur le chiffre avec bcrypt : bcrypt.hash('monMotDePasse', 10)
--   3. Tu stockes le hash résultant dans la base (ex: $2b$10$xxxx...)
--   4. Pour vérifier : bcrypt.compare('motDePasseSaisi', hashEnBase)
--
-- Pour l'instant, on insère des mots de passe en clair pour tester.
-- À remplacer par des vrais hashes avant la mise en production.
-- ============================================================
 
 
-- ------------------------------------------------------------
-- Utilisateurs (le personnel de la clinique)
-- ------------------------------------------------------------
-- 💡 Rappel : pour ajouter un employé DEPUIS TA PLATEFORME,
--    ton application web fera un INSERT similaire à ceux-ci,
--    sans que tu aies besoin d'ouvrir pgAdmin ou psql.
 
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Lannes',  'Antoines Lannes',  'michel.lannes@clinique-etangs.fr',   '$2y$12$vI0iCEeOnTlWxkkkvf0oe.T81RdjNHWClhbT8Wr8ZJCISs0Pw7ZHG', 'directeur'),
('Martin',  'Elodie Martin',  'sophie.martin@clinique-etangs.fr',   '$2y$12$vI0iCEeOnTlWxkkkvf0oe.T81RdjNHWClhbT8Wr8ZJCISs0Pw7ZHG', 'veterinaire'),
('Dupont',  'Camille Roux',   'julie.dupont@clinique-etangs.fr',    '$2y$12$vI0iCEeOnTlWxkkkvf0oe.T81RdjNHWClhbT8Wr8ZJCISs0Pw7ZHG', 'accueil');
 
-- ⚠️  Pendant le développement uniquement, tu peux utiliser :
-- mot_de_passe = '1234'  ou  mot_de_passe = 'test'
-- Mais pense à les remplacer avant de déployer.
 
 
-- ------------------------------------------------------------
-- Propriétaires (clients de la clinique)
-- ------------------------------------------------------------
 
INSERT INTO proprietaires (nom, prenom, telephone, email, adresse) VALUES
('Dupont',  'Laura',   '06 11 22 33 44', 'laura.dupont@mail.com',  '12 rue des Lilas, Montluçon'),
('Garcia',  'Michel',  '06 55 66 77 88', 'michel.garcia@mail.com', '4 avenue Gambetta, Montluçon'),
('Roux',    'Camille', '06 99 88 77 66', 'camille.roux@mail.com',  '8 impasse des Roses, Vichy'),
('Bernard', 'Marie',   '07 12 34 56 78', 'marie.bernard@mail.com', '23 chemin du Moulin, Moulins');
 
 
-- ------------------------------------------------------------
-- Animaux
-- ------------------------------------------------------------
 
INSERT INTO animaux (proprietaire_id, nom, espece, race, sexe, date_naissance, poids, allergies, comportement, alerte_risque) VALUES
(1, 'Naya',  'Chien', 'Berger Allemand',   'F', '2019-03-15', 28.5, NULL,              'Calme',          NULL),
(2, 'Gab',   'Chat',  'Européen',          'M', '2020-07-22',  4.2, 'Amoxicilline',    'Nerveux',        'Morsures possibles'),
(3, 'Nova',  'Chien', 'Labrador',          'F', '2021-01-10', 24.0, NULL,              'Joueur',         NULL),
(4, 'Luna',  'Chat',  'Persan',            'F', '2018-11-05',  3.8, NULL,              'Craintif',       NULL),
(1, 'Max',   'Chien', 'Golden Retriever',  'M', '2022-05-20', 32.0, NULL,              'Très énergique', NULL),
(4, 'Rocky', 'Chien', 'Bouledogue Français','M', '2020-09-30', 12.5, NULL,             'Agressif',       'Urgence : mordeur');
 
 
-- ------------------------------------------------------------
-- Rendez-vous
-- ------------------------------------------------------------
 
INSERT INTO rendez_vous (animal_id, proprietaire_id, veterinaire_id, motif, date_heure_debut, date_heure_fin, statut, notes) VALUES
(5, 1, 2, 'Consultation annuelle',     '2026-01-17 09:00:00', '2026-01-17 09:30:00', 'termine',  NULL),
(4, 4, 2, 'Vaccin rappel',             '2026-01-17 09:30:00', '2026-01-17 10:00:00', 'termine',  NULL),
(6, 4, 3, 'Urgence - blessure patte',  '2026-01-17 10:00:00', '2026-01-17 10:45:00', 'termine',  'Animal agressif, prévoir muselière'),
(1, 1, 2, 'Contrôle post-opératoire', '2026-01-24 14:00:00', '2026-01-24 14:30:00', 'prevu',    NULL);
 
 
-- ------------------------------------------------------------
-- Consultations
-- ------------------------------------------------------------
 
INSERT INTO consultations (animal_id, veterinaire_id, rendez_vous_id, motif, observations, diagnostic, actes_realises, date_consultation) VALUES
(5, 2, 1, 'Consultation annuelle',    'Animal en bonne santé, poil brillant',        'RAS',                     'Examen clinique complet, pesée',      '2026-01-17 09:00:00'),
(4, 2, 2, 'Vaccin rappel',            'Légère sensibilité au point d''injection',    'Réaction normale au vaccin','Injection vaccin typhus/leucose',     '2026-01-17 09:30:00'),
(6, 3, 3, 'Urgence - blessure patte', 'Plaie profonde membre antérieur gauche',      'Lacération cutanée',        'Nettoyage, suture, bandage',          '2026-01-17 10:05:00'),
(1, 2, NULL, 'Chirurgie stérilisation', 'Intervention sans complication',             'Stérilisation réalisée',   'Ovariectomie, anesthésie générale',   '2025-12-12 08:30:00');
 
 
-- ------------------------------------------------------------
-- Ordonnances
-- ------------------------------------------------------------
 
INSERT INTO ordonnances (consultation_id, veterinaire_id, medicament, dosage, frequence, duree, consignes) VALUES
(3, 3, 'Carprodyl 50mg',    '1 comprimé',  '1 fois par jour',  '7 jours',  'Donner avec la nourriture'),
(3, 3, 'Amoxicilline 200mg','2 comprimés', '2 fois par jour',  '10 jours', 'Terminer le traitement complet'),
(4, 2, 'Metacam 1mg/ml',    '0.5 ml',      '1 fois par jour',  '5 jours',  'Mélanger dans la pâtée');
 
 
-- ------------------------------------------------------------
-- Vaccinations
-- ------------------------------------------------------------
 
INSERT INTO vaccinations (animal_id, veterinaire_id, type_vaccin, date_vaccination, date_rappel, statut) VALUES
(5, 2, 'Vaccin CHPPiL',     '2025-01-10', '2026-01-10', 'rappel requis'),
(4, 2, 'Vaccin typhus/leucose', '2026-01-17', '2027-01-17', 'à jour'),
(1, 2, 'Vaccin CHPPiL',     '2025-06-15', '2026-06-15', 'à jour'),
(3, 3, 'Vaccin rage',       '2025-03-20', '2026-03-20', 'à jour');
 
 
-- ------------------------------------------------------------
-- Produits (stock)
-- ------------------------------------------------------------
 
INSERT INTO produits (nom, categorie, prix_unitaire, quantite_stock, seuil_alerte, description) VALUES
('Carprodyl 50mg',       'Médicament',  12.50,  45,  10, 'Anti-inflammatoire pour chien'),
('Amoxicilline 200mg',   'Médicament',   8.90,   8,  10, 'Antibiotique à large spectre'),  -- ⚠️ stock bas
('Metacam 1mg/ml',       'Médicament',  18.00,  22,   5, 'Anti-douleur, AINS'),
('Vermifuge Milbemax',   'Médicament',   9.50,   3,  10, 'Antiparasitaire interne chien'), -- ⚠️ stock bas (alerte maquette)
('Collier antiparasitaire Seresto', 'Accessoire', 34.90, 15, 5, 'Protection 8 mois'),
('Aliment Hill''s prescription', 'Alimentation', 52.00, 20, 5, 'Nourriture vétérinaire digestive');
 
 
-- ------------------------------------------------------------
-- Factures
-- ------------------------------------------------------------
 
INSERT INTO factures (proprietaire_id, consultation_id, montant_total, montant_paye, statut, mode_paiement, notes) VALUES
(4, 4, 480.00, 480.00, 'paye',   'carte',   'Chirurgie stérilisation Naya'),  -- payé (vu dans maquette)
(2, 1,  95.00,  95.00, 'paye',   'espèces', 'Consultation + vaccin Gab'),
(3, NULL, 160.00, 0.00, 'impaye', NULL,      'Facture traitement Rocky'),       -- impayé (vu dans maquette)
(1, 3,  95.00,  50.00, 'partiel','carte',   'Paiement partiel reçu');
 
 
-- ------------------------------------------------------------
-- Lignes de facture (détail des factures)
-- ------------------------------------------------------------
 
-- Facture 1 : chirurgie Naya (480€)
INSERT INTO lignes_facture (facture_id, produit_id, description, quantite, prix_unitaire, sous_total) VALUES
(1, NULL, 'Consultation chirurgie',   1, 120.00, 120.00),
(1, 1,    'Carprodyl 50g',            1,  80.00,  80.00),
(1, NULL, 'Hospitalisation 24h',      1, 280.00, 280.00);
 
-- Facture 2 : Gab (95€)
INSERT INTO lignes_facture (facture_id, produit_id, description, quantite, prix_unitaire, sous_total) VALUES
(2, NULL, 'Consultation annuelle', 1, 55.00, 55.00),
(2, NULL, 'Injection vaccin',      1, 40.00, 40.00);
 
-- Facture 3 : Rocky (160€)
INSERT INTO lignes_facture (facture_id, produit_id, description, quantite, prix_unitaire, sous_total) VALUES
(3, NULL, 'Consultation urgence',  1,  80.00,  80.00),
(3, 1,    'Carprodyl 50mg x5',     5,  12.50,  62.50),
(3, NULL, 'Suture',                1,  17.50,  17.50);
 
-- Facture 4 : Luna partiel (95€)
INSERT INTO lignes_facture (facture_id, produit_id, description, quantite, prix_unitaire, sous_total) VALUES
(4, NULL, 'Consultation',         1, 55.00, 55.00),
(4, 3,    'Metacam 1mg/ml',       1, 40.00, 40.00);
 