import privacyEn from '@/content/legal/privacy.en.json';
import termsEn from '@/content/legal/terms.en.json';

export type LegalDocument = 'privacy' | 'terms';

const documents = {
  privacy: privacyEn,
  terms: termsEn,
};

export function getLegalContent(document: LegalDocument) {
  return documents[document];
}
