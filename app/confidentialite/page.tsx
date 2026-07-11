import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";

export const metadata = {
  title: `Politique de confidentialité — ${site.brand}`,
};

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      updatedAt="[À compléter]"
    >
      <p>
        <strong>⚠️ Template à compléter.</strong> Adapte ce texte à ta
        situation réelle (outils utilisés, sous-traitants, durées de
        conservation) et assure-toi de sa conformité RGPD avant mise en
        ligne.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        {site.legalName}, éditeur du site {site.domain}, est responsable du
        traitement des données collectées. [À compléter : adresse, SIRET.]
      </p>

      <h2>2. Données collectées</h2>
      <p>
        Nous collectons les données nécessaires au traitement de ta
        commande : nom, adresse email, adresse de livraison, informations
        de paiement (traitées directement par Stripe, {site.brand} n&apos;a
        jamais accès à ton numéro de carte bancaire).
      </p>

      <h2>3. Finalités</h2>
      <ul>
        <li>Traitement et suivi des commandes</li>
        <li>Service client et gestion des retours</li>
        <li>Communication marketing (si tu y as consenti)</li>
      </ul>

      <h2>4. Durée de conservation</h2>
      <p>
        [À compléter : durées de conservation selon la nature des données.]
      </p>

      <h2>5. Tes droits</h2>
      <p>
        Conformément au RGPD, tu disposes d&apos;un droit d&apos;accès, de
        rectification, d&apos;effacement et de portabilité de tes données.
        Pour exercer ces droits, contacte-nous à{" "}
        <a href={`mailto:${site.supportEmail}`} className="underline">
          {site.supportEmail}
        </a>
        .
      </p>

      <h2>6. Cookies</h2>
      <p>
        Le site utilise des cookies techniques nécessaires au bon
        fonctionnement du panier et du paiement. [À compléter si des
        cookies analytics/publicité sont ajoutés.]
      </p>
    </LegalPage>
  );
}
