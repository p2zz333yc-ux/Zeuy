import { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  updatedAt?: string;
  children: ReactNode;
};

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-serif text-3xl font-semibold text-stone-900">
        {title}
      </h1>
      {updatedAt ? (
        <p className="mt-2 text-sm text-stone-500">
          Dernière mise à jour : {updatedAt}
        </p>
      ) : null}
      <div className="prose prose-stone mt-8 max-w-none space-y-6 text-sm leading-relaxed text-stone-700 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-stone-900 [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        {children}
      </div>
    </div>
  );
}
