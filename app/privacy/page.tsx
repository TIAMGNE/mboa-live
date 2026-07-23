'use client';

import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <button onClick={() => router.back()} className="mb-4 font-display text-xs font-semibold text-dim hover:text-ink">
        ← Retour
      </button>

      <h1 className="font-display text-2xl font-bold text-ink">Politique de confidentialité</h1>
      <p className="mt-2 text-xs text-dim">Dernière mise à jour : à compléter.</p>

      <div className="mt-6 rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm text-ink">
        ⚠️ Ce texte est un modèle de base, pas un document juridique validé. Fais-le relire par un juriste
        avant une mise en ligne publique.
      </div>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink">
        <section>
          <h2 className="font-display text-base font-bold text-ink">Données que nous collectons</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-dim">
            <li>Nom, e-mail, ville (à l&apos;inscription)</li>
            <li>Numéro de téléphone (optionnel)</li>
            <li>Photo de profil et bio (optionnel)</li>
            <li>Position géographique (uniquement avec ton autorisation, pour les signalements et la carte)</li>
            <li>Contenus que tu publies : signalements, photos, vidéos, commentaires, messages privés</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">Pourquoi nous les utilisons</h2>
          <p className="mt-2 text-dim">
            Uniquement pour faire fonctionner l&apos;application : afficher les signalements près de chez
            toi, te permettre de publier et d&apos;échanger avec d&apos;autres utilisateurs, et t&apos;envoyer
            des notifications liées à ton activité.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">Où sont stockées tes données</h2>
          <p className="mt-2 text-dim">
            Tes données sont hébergées chez Supabase (infrastructure cloud) et Vercel (hébergement du site),
            deux prestataires techniques utilisés par de nombreuses applications dans le monde. Selon la
            région d&apos;hébergement choisie, tes données peuvent être stockées en dehors du Cameroun.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">Tes droits</h2>
          <p className="mt-2 text-dim">
            Tu peux à tout moment consulter et modifier tes informations depuis ton profil. Pour demander la
            suppression complète de ton compte et de tes données, contacte [e-mail de contact à compléter].
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">Partage avec des tiers</h2>
          <p className="mt-2 text-dim">
            Nous ne vendons pas tes données. Certaines informations que tu choisis de publier (signalements,
            commentaires, profil) sont visibles par les autres utilisateurs de l&apos;application, c&apos;est
            le principe même du service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">Contact</h2>
          <p className="mt-2 text-dim">Pour toute question sur tes données : [e-mail de contact à compléter].</p>
        </section>
      </div>
    </div>
  );
}
