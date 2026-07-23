'use client';

import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <button onClick={() => router.back()} className="mb-4 font-display text-xs font-semibold text-dim hover:text-ink">
        ← Retour
      </button>

      <h1 className="font-display text-2xl font-bold text-ink">Conditions générales d&apos;utilisation</h1>
      <p className="mt-2 text-xs text-dim">Dernière mise à jour : à compléter.</p>

      <div className="mt-6 rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm text-ink">
        ⚠️ Ce texte est un modèle de base, pas un document juridique validé. Avant une vraie mise en ligne
        publique, fais-le relire par un juriste, notamment pour vérifier sa conformité avec le droit
        camerounais (protection des données, responsabilité des contenus publiés par les utilisateurs).
      </div>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink">
        <section>
          <h2 className="font-display text-base font-bold text-ink">1. Objet</h2>
          <p className="mt-2 text-dim">
            MBOA LIVE est une application permettant à ses utilisateurs de signaler et de consulter des
            événements et problèmes locaux (voirie, éclairage, eau, environnement, etc.) au Cameroun, et
            d&apos;échanger entre eux via des commentaires et une messagerie privée.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">2. Inscription et compte</h2>
          <p className="mt-2 text-dim">
            L&apos;utilisation de l&apos;application nécessite la création d&apos;un compte avec une adresse
            e-mail valide. Tu es responsable de la confidentialité de ton mot de passe et de toute activité
            effectuée depuis ton compte. L&apos;application est destinée aux personnes âgées de 16 ans ou
            plus.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">3. Contenu publié par les utilisateurs</h2>
          <p className="mt-2 text-dim">
            Les signalements, photos, vidéos et commentaires publiés sont soumis par les utilisateurs
            eux-mêmes et n&apos;engagent pas MBOA LIVE quant à leur exactitude. Il est interdit de publier du
            contenu illégal, diffamatoire, violent, mensonger dans l&apos;intention de nuire, ou portant
            atteinte à la vie privée d&apos;autrui. Tout contenu signalé par la communauté peut être examiné
            et retiré par l&apos;équipe de modération.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">4. Localisation</h2>
          <p className="mt-2 text-dim">
            Certaines fonctionnalités (signalement, carte) utilisent ta position géographique, uniquement
            avec ton autorisation explicite via ton navigateur ou ton appareil.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">5. Suspension et suppression de compte</h2>
          <p className="mt-2 text-dim">
            En cas de non-respect de ces conditions, l&apos;accès à un compte peut être suspendu ou
            supprimé. Tu peux demander la suppression de ton compte à tout moment (voir la page
            Confidentialité).
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-bold text-ink">6. Contact</h2>
          <p className="mt-2 text-dim">Pour toute question : [e-mail de contact à compléter].</p>
        </section>
      </div>
    </div>
  );
}
