/**
 * Schema.org shapes, built in one place.
 *
 * The identity strings live here rather than being repeated at each call site, so
 * changing who the site belongs to is one edit rather than a search across the tree.
 * They match `app/layout.tsx` — change both together.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PERSON = {
  name: "Vinuka Osura Anupama",
  jobTitle: "Software Engineer",
  github: "https://github.com/Vinuka-Osura",
  linkedIn: "https://www.linkedin.com/in/vinuka-osura-anupama/",
};

/** The `@id` every other node points at, so search engines treat them as one person. */
const personId = `${SITE_URL}#person`;

export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId,
    name: PERSON.name,
    jobTitle: PERSON.jobTitle,
    url: SITE_URL,
    // Every profile that is demonstrably the same person, so a search engine can merge
    // them into one entity rather than treating each as a separate someone.
    sameAs: [PERSON.github, PERSON.linkedIn],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: `${PERSON.name} — ${PERSON.jobTitle}`,
    inLanguage: "en-GB",
    // Not `author`: the site is *about* this person and *by* them, and publisher is the
    // property a search engine actually uses for the site-level relationship.
    publisher: { "@id": personId },
  };
}

export function articleSchema(article: {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string | null;
  updatedAt?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    url: `${SITE_URL}/knowledge/${article.slug}`,
    // Omitted rather than faked when absent. A wrong date is worse than no date: it
    // ends up in a search result, visible, and stated with confidence.
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    author: { "@id": personId },
    publisher: { "@id": personId },
    inLanguage: "en-GB",
  };
}

export function projectSchema(project: {
  title: string;
  pitch: string;
  slug: string;
  startDate: string;
  endDate: string | null;
  techStack: string[];
  githubUrl?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    // CreativeWork rather than SoftwareApplication: a case study describes work that was
    // done, not something a reader can go and install.
    "@type": "CreativeWork",
    name: project.title,
    abstract: project.pitch,
    url: `${SITE_URL}/projects/${project.slug}`,
    dateCreated: project.startDate,
    ...(project.endDate ? { dateModified: project.endDate } : {}),
    keywords: project.techStack.join(", "),
    creator: { "@id": personId },
    ...(project.githubUrl ? { codeRepository: project.githubUrl } : {}),
  };
}

/** Tells a search engine where a page sits, so the result shows a path rather than a bare URL. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}
