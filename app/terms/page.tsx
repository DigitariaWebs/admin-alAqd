import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import { LegalDocument } from '@/lib/db/models/LegalDocument';

export const metadata: Metadata = {
  title: 'Terms of Use — Al-Aqd',
  description: 'Terms of Use for the Al-Aqd application',
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ lang?: string }>;

const ALLOWED_LANGUAGES = ['en', 'fr', 'ar', 'es'] as const;

export default async function TermsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { lang: requestedLang } = await searchParams;
  const lang = ALLOWED_LANGUAGES.includes(requestedLang as any)
    ? requestedLang
    : 'en';

  await connectDB();

  let doc = await LegalDocument.findOne({ type: 'terms', language: lang }).lean();
  if (!doc && lang !== 'fr') {
    doc = await LegalDocument.findOne({ type: 'terms', language: 'fr' }).lean();
  }

  if (!doc) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Version {doc.version} — Updated {new Date(doc.updatedAt).toLocaleDateString()}
      </p>
      <article className="whitespace-pre-wrap leading-relaxed">
        {doc.content}
      </article>
    </main>
  );
}
