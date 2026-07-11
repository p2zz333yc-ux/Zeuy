import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";

export const metadata = {
  title: `Mentions légales — ${site.brand}`,
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updatedAt="[À compléter]">
      <p>
        <strong>⚠️ Template à compléter</strong> avec les informations
        légales réelles de ton entreprise (SIRET, forme juridique, capital
        social, hébergeur).
      </p>

      <h2>Éditeur du site</h2>
      <ul>
        <li>Raison sociale : {site.legalName} [À compléter]</li>
        <li>Forme juridique : [À compléter]</li>
        <li>Siège social : [À compléter]</li>
        <li>SIRET : [À compléter]</li>
        <li>Directeur de la publication : [À compléter]</li>
        <li>
          Contact :{" "}
          <a href={`mailto:${site.supportEmail}`} className="underline">
            {site.supportEmail}
          </a>
        </li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        Site hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA
        91789, États-Unis. [À vérifier selon ton hébergeur final.]
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus présents sur {site.domain} (textes,
        images, logo) est la propriété de {site.legalName}, sauf mention
        contraire, et ne peut être reproduit sans autorisation.
      </p>
    </LegalPage>
  );
}
