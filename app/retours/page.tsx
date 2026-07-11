import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";

export const metadata = {
  title: `Politique de retour — ${site.brand}`,
};

export default function RetoursPage() {
  return (
    <LegalPage title="Politique de retour" updatedAt="[À compléter]">
      <p>
        <strong>⚠️ Template à compléter</strong> avec ton adresse de retour
        réelle et ton process logistique.
      </p>

      <h2>Garantie satisfait ou remboursé</h2>
      <p>
        {site.brand} t&apos;offre {site.guaranteeDays} jours à compter de la
        réception de ta commande pour changer d&apos;avis. Si le produit ne
        te convient pas, contacte-nous et nous te remboursons intégralement.
      </p>

      <h2>Comment effectuer un retour</h2>
      <ul>
        <li>
          Écris-nous à{" "}
          <a href={`mailto:${site.supportEmail}`} className="underline">
            {site.supportEmail}
          </a>{" "}
          en précisant ton numéro de commande.
        </li>
        <li>Nous te communiquons l&apos;adresse de retour.</li>
        <li>Renvoie le produit dans son emballage d&apos;origine.</li>
        <li>
          Le remboursement est effectué sous 14 jours après réception du
          retour, sur le moyen de paiement utilisé.
        </li>
      </ul>

      <h2>Produits concernés</h2>
      <p>
        [À compléter : conditions d&apos;hygiène éventuelles pour un
        produit de soin capillaire, état du produit exigé au retour.]
      </p>
    </LegalPage>
  );
}
