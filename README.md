# MBOA LIVE — Le Cameroun en temps réel

MVP fonctionnel pour Douala et Yaoundé : carte live, signalements en temps
réel, confirmations, commentaires, comptes utilisateurs, et tableau de bord
admin.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (base de
données, authentification, stockage de fichiers, temps réel) · Leaflet
(carte, gratuit, sans clé API).

## 1. Installer les dépendances

Il te faut [Node.js](https://nodejs.org) (version 18 ou plus) installé sur
ton ordinateur. Ensuite, dans le dossier du projet :

```bash
npm install
```

## 2. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) et crée un compte gratuit.
2. Crée un nouveau projet (`New project`).
3. Une fois prêt, va dans **Project Settings → API** et note :
   - `Project URL`
   - `anon public key`

## 3. Configurer les variables d'environnement

Copie `.env.local.example` en `.env.local` et remplis avec tes valeurs :

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta-cle-anon-publique
```

## 4. Créer les tables de la base de données

Dans le tableau de bord Supabase : **SQL Editor → New query**, colle le
contenu du fichier `supabase/schema.sql`, puis clique sur **Run**.

Ça crée toutes les tables (signalements, profils, catégories, villes,
confirmations, commentaires, notifications) avec la sécurité (Row Level
Security) déjà configurée.

## 5. Créer le bucket de stockage (photos/vidéos)

Dans le tableau de bord Supabase : **Storage → New bucket**.

- Nom : `reports-media`
- Coche **Public bucket** (pour que les photos/vidéos des signalements
  s'affichent sur le site)

## 6. Activer la connexion Google (optionnel)

Dans **Authentication → Providers → Google**, active le fournisseur et
suis les instructions Supabase pour créer les identifiants Google OAuth.
Sans cette étape, la connexion par e-mail/mot de passe fonctionne déjà
normalement.

## 7. Te donner les droits admin

Une fois inscrit sur le site avec ton compte :

1. Va dans **Table Editor → profiles** sur Supabase.
2. Trouve ta ligne (par ton e-mail dans `auth.users` si besoin de
   recouper l'ID).
3. Mets la colonne `is_admin` à `true`.
4. Va sur `/admin` sur le site : tu as maintenant accès au tableau de
   bord.

## 8. Lancer le site en local

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## 9. Mettre le site en ligne

Le plus simple est [Vercel](https://vercel.com) (créé par l'équipe
Next.js, gratuit pour démarrer) :

1. Pousse ce dossier sur un dépôt GitHub.
2. Sur Vercel, clique sur **New Project** et importe ce dépôt.
3. Ajoute les mêmes variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) dans les réglages du projet Vercel.
4. Déploie.

## 10. Publier sur le Google Play Store

Le site est maintenant "installable" (PWA) avec sa propre icône. Pour en
faire une vraie application listée sur le Play Store, sans réécrire le
code :

1. Va sur **[pwabuilder.com](https://www.pwabuilder.com)**
2. Colle l'adresse de ton site en ligne (ton URL Vercel, ex.
   `https://mboa-live.vercel.app`)
3. Clique sur **"Start"** — l'outil analyse le site automatiquement
4. Va dans l'onglet **Android** → **"Generate Package"** → télécharge le
   fichier `.aab` généré
5. Crée un compte **Google Play Console**
   ([play.google.com/console](https://play.google.com/console)) — 25$,
   paiement unique, à vie
6. Dans la Play Console, crée une nouvelle application, remplis la fiche
   (nom, description, captures d'écran, icône — déjà dans
   `public/icons/`), et téléverse le fichier `.aab`
7. Soumets pour validation (Google prend généralement 1 à 3 jours)

## Notes importantes

- **"J'aime"** : la V1 ne comprend pas encore de bouton "j'aime" distinct
  — les actions fonctionnelles sont Confirmer (toujours d'actualité / c'est
  terminé), Commenter et Partager. Un système de likes peut être ajouté
  facilement avec une table `likes` supplémentaire si tu en as besoin.
- **Décroissance de fiabilité** : les signalements perdent en visibilité
  avec le temps s'ils ne sont pas reconfirmés (voir `lib/reportUtils.ts`),
  plus vite pour les catégories "embouteillage/accident" que pour
  "événement/promotion".
- **Modération** : un admin peut supprimer un signalement (passe son statut
  à `removed`) depuis `/admin`.
