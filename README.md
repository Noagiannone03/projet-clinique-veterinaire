# 🐾 Clinique Vétérinaire - Gestion de Cabinet

Ce projet est une application complète de gestion pour une clinique vétérinaire, comprenant un frontend en **React (Vite/TypeScript)** et un backend en **Symfony (PHP 8)** avec une base de données **PostgreSQL**.

---

## 📁 Structure du Projet

Le projet est organisé en deux parties principales :
- `backend/` : API Symfony (Logique métier, Authentification, Base de données).
- `frontend/` : Application React (Interface utilisateur, État clinique).

---

## 🚀 Installation et Lancement

### 1. Prérequis
- **PHP 8.1+** et **Composer**
- **Node.js 18+** et **npm**
- **PostgreSQL** (installé et en cours d'exécution)
- **Symfony CLI** (recommandé pour le serveur local)

### 2. Configuration du Backend
1. Entrez dans le dossier backend :
   ```bash
   cd backend
   ```
2. Installez les dépendances PHP :
   ```bash
   composer install
   ```
3. Configurez votre base de données dans le fichier `.env` ou `.env.local` :
   ```env
   DATABASE_URL="postgresql://VOTRE_USER:VOTRE_PASSWORD@127.0.0.1:5432/clinique_veterinaire?serverVersion=16&charset=utf8"
   ```
4. Importez les données de test (optionnel) :
   ```bash
   # Créez d'abord la base de données
   php bin/console doctrine:database:create
   # Importez le dump SQL
   psql -U VOTRE_USER -d clinique_veterinaire < ../database_export.sql
   ```
5. Ou lancez les migrations si vous repartez de zéro :
   ```bash
   php bin/console doctrine:migrations:migrate
   ```
6. Lancez le serveur backend :
   ```bash
   symfony server:start -d
   # OU
   php -S localhost:8000 -t public
   ```

### 3. Configuration du Frontend
1. Entrez dans le dossier frontend :
   ```bash
   cd frontend
   ```
2. Installez les dépendances npm :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
4. L'application est accessible sur [http://localhost:5173](http://localhost:5173).

---

## 🔐 Identifiants de test (Demo)

L'application utilise les rôles suivants :
- **Directeur** : `michel.lannes@clinique-etangs.fr` / `admin`
- **Vétérinaire** : `dr.martin@clinique-etangs.fr` / `admin`
- **Assistant** : `sophie.legrand@clinique-etangs.fr` / `admin`

---

## 🛠️ Technologies utilisées
- **Frontend** : React 19, Vite, Tailwind CSS, Lucide React, Recharts, FullCalendar.
- **Backend** : Symfony 7, Doctrine ORM, NelmioCorsBundle.
- **Base de données** : PostgreSQL.
