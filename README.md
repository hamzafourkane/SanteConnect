## Description Courte
HealthTrack est une application web de suivi de santé hybride (SQL + NoSQL) permettant aux patients de suivre leurs indicateurs de santé (tension, poids, sommeil, activité) et aux médecins de surveiller leurs patients autorisés. Le backend est développé avec Laravel et le frontend avec React.

## Description du projet
Plateforme de gestion et d’analyse de données de santé, développée avec Laravel et React, intégrant des fonctionnalités NoSQL pour une meilleure performance et flexibilité.

## Prérequis
- PHP 8.2 ou supérieur
- Composer
- Node.js 20.x ou supérieur
- MySQL 8.0+
- MongoDB 6.0+
- Redis 7.0+

## Instructions d’Installation

### Backend
1. Ouvrir un terminal et se placer dans le dossier backend :
   cd backend
2. Installer les dépendances PHP :
   composer install
3. Copier le fichier d’exemple d’environnement et le configurer :
   cp .env.example .env
   Modifier le fichier `.env` avec vos identifiants MySQL, MongoDB et Redis.
4. Générer la clé d’application Laravel :
   php artisan key:generate
5. Lancer les migrations MySQL :
   php artisan migrate
6. Créer le lien de stockage :
   php artisan storage:link
7. Démarrer le serveur de développement Laravel :
   php artisan serve

### Frontend
1. Ouvrir un terminal et se placer dans le dossier frontend :
   cd frontend
2. Installer les dépendances Node.js :
   npm install
3. Démarrer le serveur de développement React :
   npm run dev

## Commandes de Lancement Rapides
- Lancer le backend :
    -> cd backend 
    -> php artisan serve
- Lancer le frontend :
    -> cd frontend 
    -> npm run dev
  

## Données de test

### Comptes de test (après inscription)
Utilisez ces comptes pour vos tests :

**Admin :**
- Email : admin@gmail.com
- Mot de passe : 12345678

**Patient :**
- Email : patient1@gmail.com
- Mot de passe : 12345678

**Docteur :**
- Email : docteur1@gmail.com
- Mot de passe : 12345678

### Exemples de mesures
Lorsque vous ajoutez des mesures, essayez :

**Tension artérielle :**
- Systolique : 120
- Diastolique : 80

**Poids :**
- kg : 70

**Sommeil :**
- heures : 8
