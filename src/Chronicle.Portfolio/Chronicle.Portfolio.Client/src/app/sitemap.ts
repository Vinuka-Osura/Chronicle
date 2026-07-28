import type { MetadataRoute } from "next";
import { getProjects } from "@/app/projects/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const staticRoutes = [
  { path: "", priority: 1.0 },
  { path: "/about", priority: 0.8 },
  { path: "/skills", priority: 0.7 },
  { path: "/timeline", priority: 0.8 },
  { path: "/projects", priority: 0.9 },
  { path: "/knowledge", priority: 0.7 },
  { path: "/analytics", priority: 0.5 },
  { path: "/resume", priority: 0.9 },
  { path: "/contact", priority: 0.6 },
  { path: "/city", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route.path}`,
      changeFrequency: "monthly" as const,
      priority: route.priority,
    })),
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      changeFrequency: "monthly" as const,
      priority: project.featured ? 0.8 : 0.6,
    })),
  ];
}
