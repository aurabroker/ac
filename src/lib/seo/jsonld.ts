/**
 * Budowniczy JSON-LD: jeden `@graph` na stronę, stabilne `@id`.
 *   #org       — InsuranceAgency/Organization (dane spółki z src/lib/site.ts)
 *   #website   — WebSite
 *   <url>#webpage, #breadcrumb, #service, #faq, #article, #termset, #person
 * Zasady (PLAN §4.4): bez Offer i cen, bez „Lloyd's” w serviceType/areaServed,
 * bez HowTo/speakable/ocen, bez memberOf Lloyd's. FAQPage tylko przy widocznym FAQ.
 */
import { SITE, absoluteUrl, mdPathFor } from '../site.ts';
import type { Person } from '../people.ts';
import { isKnownPerson, personPath } from '../people.ts';

export type JsonLdNode = Record<string, unknown> & { '@type': string | string[]; '@id'?: string };

export const ORG_ID = `${SITE.url}/#org`;
export const WEBSITE_ID = `${SITE.url}/#website`;

const iso = (d?: Date) => (d ? d.toISOString().slice(0, 10) : undefined);
const clean = <T extends Record<string, unknown>>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))) as T;

export function organizationNode(): JsonLdNode {
  return clean({
    '@type': ['InsuranceAgency', 'Organization'],
    '@id': ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    alternateName: SITE.wordmark,
    description: SITE.description,
    url: SITE.url + '/',
    logo: { '@type': 'ImageObject', url: `${SITE.url}/brand/logo.png`, width: 512, height: 512 },
    image: `${SITE.url}/og/index.png`,
    // kontakt publiczny: telefon albo formularz (bez adresu e-mail — decyzja 4.11.2026)
    telephone: SITE.phoneE164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      postalCode: SITE.address.postalCode,
      addressLocality: SITE.address.city,
      addressCountry: SITE.address.country,
    },
    taxID: SITE.nip,
    vatID: `PL${SITE.nip}`,
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'KRS', value: SITE.krs },
      { '@type': 'PropertyValue', propertyID: 'NIP', value: SITE.nip },
      { '@type': 'PropertyValue', propertyID: 'REGON', value: SITE.regon },
      { '@type': 'PropertyValue', propertyID: 'Rejestr brokerów KNF', value: SITE.brokerRegister },
      { '@type': 'PropertyValue', propertyID: 'Zezwolenie KNF', value: SITE.knfPermit },
    ],
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'license',
      name: `Zezwolenie KNF na wykonywanie działalności brokerskiej w zakresie ubezpieczeń nr ${SITE.knfPermit}`,
      recognizedBy: { '@type': 'GovernmentOrganization', name: 'Komisja Nadzoru Finansowego', url: 'https://www.knf.gov.pl/' },
    },
    areaServed: { '@type': 'Country', name: 'Polska', identifier: 'PL' },
    knowsAbout: [
      'OC zawodowe',
      'ubezpieczenie cyber',
      'ubezpieczenie odpowiedzialności cywilnej firm IT',
      'ubezpieczenie AI',
      'OC członków zarządu (D&O)',
      'ubezpieczenie od przestępstw (crime)',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: SITE.phoneE164,
      url: SITE.formUrl,
      availableLanguage: ['pl', 'en'],
      areaServed: 'PL',
      // godziny jak na /kontakt/ (pn–pt 9:00–17:00)
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
    },
    sameAs: [...SITE.sameAs],
  });
}

export function websiteNode(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE.url + '/',
    name: SITE.name,
    inLanguage: 'pl-PL',
    publisher: { '@id': ORG_ID },
  };
}

export interface Crumb {
  label: string;
  href: string;
}

export function breadcrumbNode(url: string, crumbs: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: absoluteUrl(c.href),
    })),
  };
}

export type WebPageType = 'WebPage' | 'CollectionPage' | 'AboutPage' | 'ContactPage' | 'ProfilePage' | 'FAQPage';

export interface WebPageInput {
  url: string;
  path: string;
  type?: WebPageType;
  name: string;
  description: string;
  published?: Date;
  updated?: Date;
  hasBreadcrumb?: boolean;
  ogImage?: string;
  authorId?: string;
  reviewedById?: string;
  mainEntityId?: string;
  aboutId?: string;
}

export function webPageNode(i: WebPageInput): JsonLdNode {
  return clean({
    '@type': i.type ?? 'WebPage',
    '@id': `${i.url}#webpage`,
    url: i.url,
    name: i.name,
    description: i.description,
    inLanguage: 'pl-PL',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
    datePublished: iso(i.published),
    dateModified: iso(i.updated),
    lastReviewed: iso(i.updated),
    reviewedBy: i.reviewedById ? { '@id': i.reviewedById } : undefined,
    author: i.authorId ? { '@id': i.authorId } : undefined,
    breadcrumb: i.hasBreadcrumb ? { '@id': `${i.url}#breadcrumb` } : undefined,
    primaryImageOfPage: i.ogImage ? { '@type': 'ImageObject', url: i.ogImage, width: 1200, height: 630 } : undefined,
    mainEntity: i.mainEntityId ? { '@id': i.mainEntityId } : undefined,
    about: i.aboutId ? { '@id': i.aboutId } : undefined,
    encoding: { '@type': 'MediaObject', encodingFormat: 'text/markdown', contentUrl: SITE.url + mdPathFor(i.path) },
  });
}

export function serviceNode(i: { url: string; name: string; description: string; serviceType: string }): JsonLdNode {
  if (/lloyd/i.test(i.serviceType)) throw new Error("JSON-LD Service: „Lloyd's” nie może być w serviceType (PLAN §4.4)");
  return {
    '@type': 'Service',
    '@id': `${i.url}#service`,
    name: i.name,
    description: i.description,
    serviceType: i.serviceType,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Polska', identifier: 'PL' },
    url: i.url,
  };
}

export function faqNode(url: string, items: { q: string; a: string }[]): JsonLdNode | null {
  if (!items.length) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    isPartOf: { '@id': `${url}#webpage` },
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: stripInlineMd(f.a) },
    })),
  };
}

export interface ArticleInput {
  url: string;
  path: string;
  type?: 'BlogPosting' | 'Article';
  headline: string;
  description: string;
  published: Date;
  updated: Date;
  authorId: string;
  ogImage: string;
  keywords?: string[];
  citations?: { title: string; url: string }[];
  aboutTermIds?: string[];
  /** Hasła słownika linkowane w treści (→ DefinedTerm na /slownik/). */
  mentionTermIds?: string[];
}

export function articleNode(i: ArticleInput): JsonLdNode {
  return clean({
    '@type': i.type ?? 'BlogPosting',
    '@id': `${i.url}#article`,
    headline: i.headline,
    description: i.description,
    inLanguage: 'pl-PL',
    mainEntityOfPage: { '@id': `${i.url}#webpage` },
    isPartOf: { '@id': WEBSITE_ID },
    datePublished: iso(i.published),
    dateModified: iso(i.updated),
    author: { '@id': i.authorId },
    publisher: { '@id': ORG_ID },
    image: i.ogImage,
    keywords: i.keywords?.length ? i.keywords.join(', ') : undefined,
    citation: i.citations?.map((c) => ({ '@type': 'CreativeWork', name: c.title, url: c.url })),
    about: i.aboutTermIds?.map((id) => ({ '@id': id })),
    // węzły z @type i url (nie gołe @id) — hasło jest zdefiniowane na innej stronie (/slownik/)
    mentions: i.mentionTermIds?.map((id) => ({ '@type': 'DefinedTerm', '@id': id, url: id })),
    encoding: { '@type': 'MediaObject', encodingFormat: 'text/markdown', contentUrl: SITE.url + mdPathFor(i.path) },
  });
}

export interface TermInput {
  id: string;
  term: string;
  termEn?: string;
  definition: string;
  see?: string;
}

export function definedTermSetNode(url: string, name: string, terms: TermInput[]): JsonLdNode {
  return {
    '@type': 'DefinedTermSet',
    '@id': `${url}#termset`,
    name,
    url,
    inLanguage: 'pl-PL',
    hasDefinedTerm: terms.map((t) =>
      clean({
        '@type': 'DefinedTerm',
        '@id': `${url}#${t.id}`,
        name: straightApostrophes(t.term),
        alternateName: t.termEn ? straightApostrophes(t.termEn) : undefined,
        description: straightApostrophes(stripInlineMd(t.definition)),
        inDefinedTermSet: { '@id': `${url}#termset` },
        // url = adres samego hasła; strona, która omawia temat szerzej, jako subjectOf
        url: `${url}#${t.id}`,
        subjectOf: t.see
          ? { '@type': 'WebPage', '@id': `${absoluteUrl(t.see)}#webpage`, url: absoluteUrl(t.see) }
          : undefined,
      }),
    ),
  };
}

export function personId(p: Person): string {
  return `${absoluteUrl(personPath(p))}#person`;
}

/** Person tylko, gdy znamy imię i nazwisko; inaczej autorem jest Organization. */
export function personNode(p: Person): JsonLdNode | null {
  if (!isKnownPerson(p)) return null;
  const sameAs = [p.linkedin, ...p.sameAs].filter(Boolean);
  return clean({
    '@type': 'Person',
    '@id': personId(p),
    name: p.name,
    // opis osoby z people.yaml (zgodny z jej stroną); jobTitle tylko, gdy właściciel poda funkcję w spółce
    jobTitle: p.jobTitle,
    description: p.bio ?? `${p.name} pracuje w ${SITE.legalName}, brokerze ubezpieczeniowym (zezwolenie KNF nr ${SITE.knfPermit}).`,
    knowsAbout: p.knowsAbout.length ? p.knowsAbout : undefined,
    worksFor: { '@id': ORG_ID },
    url: absoluteUrl(personPath(p)),
    sameAs,
  });
}

/** @id autora: Person, jeśli znany; inaczej Organization. */
export function authorIdFor(p: Person | undefined): string {
  return p && isKnownPerson(p) ? personId(p) : ORG_ID;
}

export function graph(nodes: (JsonLdNode | null | undefined)[]): Record<string, unknown> {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}

/** Prosty apostrof poza widocznym HTML (JSON-LD, meta): jedna pisownia nazw typu „Lloyd's”. */
export function straightApostrophes(s: string): string {
  return s.replace(/(\p{L})\u2019(\p{L})/gu, "$1'$2");
}

/** Usuwa składnię inline Markdown z tekstu (dla JSON-LD). */
export function stripInlineMd(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1');
}
