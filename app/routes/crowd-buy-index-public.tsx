import { Link, useLoaderData } from "react-router";
import { Package, Users } from "lucide-react";
import { crowdBuyApi } from "../lib/api/crowd-buy";
import { getAssetUrl } from "../lib/assets";
import type { CrowdBuyCampaign } from "../features/crowd-buy/types";

const baseUrl = "https://app.huntr.id";
const defaultImage = `${baseUrl}/assets/img/logo/sidebar.png`;

export async function loader() {
  try {
    const response = await crowdBuyApi.getPublicCampaigns({ per_page: 48, sort: "ending_soon" });
    return { campaigns: response?.data ?? [] };
  } catch {
    return { campaigns: [] as CrowdBuyCampaign[] };
  }
}

export function meta() {
  const canonical = `${baseUrl}/crowd-buy`;
  const description = "Temukan campaign pengadaan kolektif B2B, capai volume target bersama, dan dapatkan harga grosir melalui Huntr Crowd Buy.";
  return [
    { title: "Crowd Buy B2B & Pengadaan Kolektif | Huntr.id" },
    { name: "description", content: description },
    { name: "keywords", content: "crowd buy, group buying B2B, pengadaan kolektif, grosir perusahaan, bulk sourcing, Huntr.id" },
    { name: "robots", content: "index,follow,max-image-preview:large" },
    { rel: "canonical", href: canonical },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonical },
    { property: "og:title", content: "Crowd Buy B2B & Pengadaan Kolektif | Huntr.id" },
    { property: "og:description", content: description },
    { property: "og:image", content: defaultImage },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}

function CampaignListSchema({ campaigns }: { campaigns: CrowdBuyCampaign[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Huntr Crowd Buy Campaigns",
    itemListElement: campaigns.map((campaign, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${baseUrl}/crowd-buy/p/${campaign.id}`,
      name: campaign.title,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />;
}

export default function CrowdBuyPublicIndexPage() {
  const { campaigns } = useLoaderData<typeof loader>();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6">
      <CampaignListSchema campaigns={campaigns} />
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-slate-200 pb-8 dark:border-slate-800">
          <Link to="/" className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            HUNTR<span className="text-orange-500">.ID</span>
          </Link>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Pengadaan kolektif B2B</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Crowd Buy untuk harga grosir dan kebutuhan pengadaan perusahaan.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Gabungkan kebutuhan dengan perusahaan lain, capai target kuantitas, dan dapatkan penawaran pengadaan yang lebih kompetitif.
          </p>
        </header>

        {campaigns.length ? (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Campaign Crowd Buy aktif">
            {campaigns.map((campaign) => {
              const image = campaign.image_url || getAssetUrl(campaign.image_path) || defaultImage;
              return (
                <article key={campaign.id} className="overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <img src={image} alt={campaign.title} className="h-40 w-full object-cover" loading="lazy" />
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-orange-600">{campaign.category}</p>
                    <h2 className="mt-1 line-clamp-2 font-bold text-slate-900 dark:text-white">{campaign.title}</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Rp {Number(campaign.base_price).toLocaleString("id-ID")} <span className="text-xs font-normal text-slate-500">/ {campaign.unit}</span></p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{campaign.current_quantity.toLocaleString("id-ID")} / {campaign.target_quantity.toLocaleString("id-ID")} {campaign.unit}</span>
                      <span className="inline-flex items-center gap-1"><Users size={13} /> {campaign.days_remaining} hari</span>
                    </div>
                    <Link to={`/crowd-buy/p/${campaign.id}`} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600">
                      <Package size={14} /> Lihat campaign
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="py-20 text-center text-sm text-slate-500">Belum ada campaign Crowd Buy publik saat ini.</div>
        )}
      </div>
    </main>
  );
}
