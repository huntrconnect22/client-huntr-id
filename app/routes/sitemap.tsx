import { getCatalogues } from "../lib/api";
import { crowdBuyApi } from "../lib/api/crowd-buy";

type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
};

export async function loader() {
  let products: any[] = [];
  let campaigns: any[] = [];
  try {
    const res = await getCatalogues({ page: 1 });
    if (res && Array.isArray(res.data)) {
      products = res.data;
    } else if (Array.isArray(res)) {
      products = res;
    }
  } catch (err) {
    console.error("Failed to load catalog for sitemap", err);
  }
  try {
    const response = await crowdBuyApi.getPublicCampaigns({ per_page: 100, sort: "ending_soon" });
    campaigns = (response?.data ?? []).filter((campaign: any) =>
      campaign.is_active && !["suspended", "cancelled", "failed"].includes(campaign.status),
    );
  } catch (err) {
    console.error("Failed to load Crowd Buy campaigns for sitemap", err);
  }

  const baseUrl = "https://app.huntr.id";

  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });
  };

  const urls: SitemapEntry[] = [
    { loc: `${baseUrl}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${baseUrl}/marketplace`, changefreq: "daily", priority: "0.8" },
    { loc: `${baseUrl}/crowd-buy`, changefreq: "daily", priority: "0.8" },
    ...products.map((item) => ({
      loc: `${baseUrl}/marketplace/${item.id}`,
      changefreq: "weekly",
      priority: "0.6",
    })),
    ...campaigns.map((campaign) => ({
      loc: `${baseUrl}/crowd-buy/p/${campaign.id}`,
      lastmod: campaign.updated_at || campaign.created_at,
      changefreq: "daily",
      priority: "0.7",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (u) => `<url>
    <loc>${escapeXml(u.loc)}</loc>
    ${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n  ")}
</urlset>`.trim();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
