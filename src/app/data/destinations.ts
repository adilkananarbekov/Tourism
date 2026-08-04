import destinationData from '../../../data/destinations.json';

export type DestinationFact = {
  label: string;
  value: string;
};

export type DestinationExperience = {
  title: string;
  body: string;
};

export type DestinationFaq = {
  question: string;
  answer: string;
};

export type DestinationCopy = {
  seoTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  facts: DestinationFact[];
  routeHeading: string;
  routeIntro: string;
  planningHeading: string;
  planningItems: string[];
  experienceHeading: string;
  experienceItems: DestinationExperience[];
  faqHeading: string;
  faq: DestinationFaq[];
  ctaTitle: string;
  ctaText: string;
  ctaPrimary: string;
  ctaSecondary: string;
  notFoundTitle: string;
  notFoundText: string;
};

export type Destination = {
  slug: string;
  heroImage: string;
  tourIds: number[];
  en: DestinationCopy;
  ru: DestinationCopy;
};

export const destinations = destinationData as Destination[];

export function findDestination(slug?: string) {
  return destinations.find((destination) => destination.slug === slug);
}
