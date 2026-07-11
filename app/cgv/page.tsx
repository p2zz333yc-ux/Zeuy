import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";

export const metadata = {
  title: `Conditions générales de vente — ${site.brand}`,
};

export default function CGVPage() {
  return (
    <LegalPage title="Conditions générales de vente" updatedAt="[À compléter]">
      <p>
        <strong>⚠️ Template à compléter.</strong> Ce texte est un modèle
        générique. Fais-le relire par un professionnel du droit avant mise
        en ligne, en particulier concernant le droit de rétractation français
        (Code de la consommation).
      </p>

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales de vente régissent les ventes de
        produits réalisées par {site.legalName} (« {site.brand} ») via le
        site {site.domain} auprès de consommateurs.
      </p>

      <h2>2. Produits et prix</h2>
      <p>
        Les prix sont indiqués en euros ({site.currencySymbol}), toutes
        taxes comprises. {site.brand} se réserve le droit de modifier ses
        prix à tout moment, les produits étant facturés sur la base du tarif
        en vigueur au moment de la validation de la commande.
      </p>

      <h2>3. Commande et paiement</h2>
      <p>
        Les commandes sont passées en ligne et le paiement est traité de
        façon sécurisée par notre prestataire Stripe. La commande n&apos;est
        validée qu&apos;après confirmation du paiement.
      </p>

      <h2>4. Livraison</h2>
      <p>
        La livraison est offerte pour toute commande. Les délais indicatifs
        sont précisés dans la FAQ du site. [À compléter : zones de
        livraison, transporteur, délais précis.]
      </p>

      <h2>5. Droit de rétractation</h2>
      <p>
        Conformément à la loi, tu disposes d&apos;un délai de 14 jours à
        compter de la réception du produit pour exercer ton droit de
        rétractation, sans avoir à justifier de motifs. {site.brand} offre
        en complément une garantie satisfait ou remboursé de{" "}
        {site.guaranteeDays} jours (voir notre{" "}
        <a href="/retours" className="underline">
          politique de retour
        </a>
        ).
      </p>

      <h2>6. Garantie</h2>
      <p>
        Les produits bénéficient des garanties légales de conformité et des
        vices cachés prévues par le Code civil et le Code de la
        consommation. [À compléter : coordonnées du service client.]
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute question, écris-nous à{" "}
        <a href={`mailto:${site.supportEmail}`} className="underline">
          {site.supportEmail}
        </a>
        .
      </p>
    </LegalPage>
  );
}
