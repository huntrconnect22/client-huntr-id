import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLoaderData } from "react-router";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Package,
  Layers,
  Truck,
  RotateCw,
  Share2,
  LogIn,
} from "lucide-react";
import { crowdBuyApi } from "../lib/api/crowd-buy";
import type { CrowdBuyCampaign } from "../features/crowd-buy/types";
import { CampaignProgressBar } from "../features/crowd-buy/components/CampaignProgressBar";
import { SessionManager } from "../lib/session";
import { getAssetUrl } from "../lib/assets";
import Swal from "sweetalert2";

const baseUrl = "https://app.huntr.id";
const defaultImage = `${baseUrl}/assets/img/logo/sidebar.png`;

export async function loader({ params }: { params: { id?: string } }) {
  if (!params.id) return { campaign: null, participants_count: 0 };
  try {
    return await crowdBuyApi.getCampaignDetail(params.id);
  } catch {
    return { campaign: null, participants_count: 0 };
  }
}

export function meta({ data }: { data?: { campaign?: CrowdBuyCampaign | null } }) {
  const campaign = data?.campaign;
  if (!campaign) {
    return [
      { title: "Crowd Buy Campaign | Huntr.id" },
      { name: "robots", content: "noindex,follow" },
    ];
  }

  const canonical = `${baseUrl}/crowd-buy/p/${campaign.id}`;
  const image = campaign.image_url || getAssetUrl(campaign.image_path) || defaultImage;
  const description = (campaign.description || `Gabung Crowd Buy ${campaign.title} di Huntr.id.`).slice(0, 160);
  const indexable = campaign.is_active && !["suspended", "cancelled", "failed"].includes(campaign.status);

  return [
    { title: `${campaign.title} | Crowd Buy Huntr.id` },
    { name: "description", content: description },
    { name: "keywords", content: `${campaign.title}, ${campaign.category}, crowd buy, pengadaan kolektif, grosir B2B, Huntr.id` },
    { name: "robots", content: indexable ? "index,follow,max-image-preview:large" : "noindex,follow" },
    { rel: "canonical", href: canonical },
    { property: "og:type", content: "product" },
    { property: "og:url", content: canonical },
    { property: "og:title", content: `${campaign.title} | Crowd Buy Huntr.id` },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: `${campaign.title} | Crowd Buy Huntr.id` },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}

function CampaignSchema({ campaign, participantsCount }: { campaign: CrowdBuyCampaign; participantsCount: number }) {
  const url = `${baseUrl}/crowd-buy/p/${campaign.id}`;
  const image = campaign.image_url || getAssetUrl(campaign.image_path) || defaultImage;
  const supplier = campaign.supplier?.name || campaign.initiator_company?.name || "Huntr.id";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: campaign.title,
        description: campaign.description || `Campaign pengadaan kolektif ${campaign.title}.`,
        image: [image],
        sku: campaign.code,
        category: campaign.category,
        brand: { "@type": "Organization", name: supplier },
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "IDR",
          price: Number(campaign.base_price),
          availability: campaign.is_active ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          validThrough: campaign.ends_at,
          seller: { "@type": "Organization", name: supplier },
          eligibleQuantity: { "@type": "QuantitativeValue", minValue: campaign.min_order_qty, unitText: campaign.unit },
        },
        additionalProperty: [
          { "@type": "PropertyValue", name: "Target quantity", value: `${campaign.target_quantity} ${campaign.unit}` },
          { "@type": "PropertyValue", name: "Current collective quantity", value: `${campaign.current_quantity} ${campaign.unit}` },
          { "@type": "PropertyValue", name: "Participating companies", value: participantsCount },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Huntr.id", item: baseUrl },
          { "@type": "ListItem", position: 2, name: "Crowd Buy", item: `${baseUrl}/crowd-buy` },
          { "@type": "ListItem", position: 3, name: campaign.title, item: url },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />;
}

export default function CrowdBuyPublicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loaderData = useLoaderData<typeof loader>();
  const [campaign, setCampaign] = useState<CrowdBuyCampaign | null>(loaderData?.campaign ?? null);
  const [participantsCount, setParticipantsCount] = useState<number>(loaderData?.participants_count ?? 0);
  const [loading, setLoading] = useState(!loaderData?.campaign);

  useEffect(() => {
    if (!id) return;
    if (loaderData?.campaign && String(loaderData.campaign.id) === id) {
      setCampaign(loaderData.campaign);
      setParticipantsCount(loaderData.participants_count || 0);
      setLoading(false);
      return;
    }
    setLoading(true);
    crowdBuyApi
      .getCampaignDetail(id)
      .then((res) => {
        setCampaign(res.campaign);
        setParticipantsCount(res.participants_count || 0);
      })
      .catch((err) => {
        console.error("Failed to load public campaign detail", err);
      })
      .finally(() => setLoading(false));
  }, [id, loaderData]);

  const handleJoinClick = () => {
    const company = SessionManager.getCompany();
    const companySlug = company?.slug;
    if (companySlug) {
      navigate(`/${companySlug}/crowd-buy/${campaign?.id}`);
    } else {
      navigate(`/login?redirect=/crowd-buy/p/${campaign?.id}`);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Tautan campaign disalin ke clipboard!",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <RotateCw className="w-7 h-7 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-950">
        <Package className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Campaign tidak ditemukan</h3>
        <Link to="/login" className="text-xs text-orange-600 hover:underline">
          Masuk ke Huntr Platform
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 md:px-8">
      <CampaignSchema campaign={campaign} participantsCount={participantsCount} />
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Navigation bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <Link to="/crowd-buy" className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              HUNTR<span className="text-orange-500">.ID</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400">
              Crowd Buy
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Bagikan
            </button>
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> Masuk
            </Link>
          </div>
        </div>

        {/* Content Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-5">
            <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 rounded">
                  {campaign.category}
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
                  {campaign.title}
                </h1>
                <p className="text-xs text-slate-500">
                  Disediakan oleh <strong className="text-slate-700 dark:text-slate-300">{campaign.supplier?.name}</strong> • Kode: {campaign.code}
                </p>
              </div>

              {/* Image banner */}
              <div className="w-full h-60 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60">
                {campaign.image_url ? (
                  <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto mb-1 opacity-40" />
                    <span className="text-[11px] uppercase font-bold tracking-wider">Crowd Buy Bulk Sourcing</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
                <CampaignProgressBar
                  current={campaign.current_quantity}
                  target={campaign.target_quantity}
                  max={campaign.max_quantity}
                  unit={campaign.unit}
                  percentage={campaign.progress_percentage}
                  isTargetReached={campaign.is_target_reached}
                />
                <div className="flex justify-between text-xs text-slate-500 pt-0.5">
                  <span>Partisipan: <strong>{participantsCount} Perusahaan</strong></span>
                  <span>Batas Waktu: <strong>{campaign.days_remaining} hari lagi</strong></span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Deskripsi Produk</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {campaign.description || "Tidak ada deskripsi tambahan."}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action */}
          <div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
              <div>
                <span className="text-xs text-slate-500">Harga Satuan Grosir:</span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  Rp {Number(campaign.base_price).toLocaleString("id-ID")}
                  <span className="text-xs font-normal text-slate-500"> / {campaign.unit}</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 py-2.5 border-y border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span>MOQ per Buyer:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{campaign.min_order_qty} {campaign.unit}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Batas Waktu:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {new Date(campaign.ends_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </strong>
                </div>
              </div>

              <button
                onClick={handleJoinClick}
                className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-md font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Gabung Crowd Buy Sekarang</span>
              </button>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 justify-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pengadaan Resmi B2B Huntr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
