import React, { useEffect, useState } from "react";
import type { MetaFunction } from "react-router";
import { PageSkeleton } from "../components/dashboard/PageSkeleton";
import { BuyerDashboard } from "../components/dashboard/BuyerDashboard";
import { VendorEbiddingDashboard } from "../components/dashboard/VendorEbiddingDashboard";
import { GuestMarketplaceView } from "../components/dashboard/GuestMarketplaceView";

import { isVendorBuyerMode, VENDOR_BUYER_MODE_EVENT } from "../lib/viewMode";

export const meta: MetaFunction = () => {
  return [
    { title: "Huntr.id - Enterprise B2B E-Procurement Ecosystem" },
    { name: "description", content: "Connect with verified vendors, streamline your RFQ process, and manage purchase orders in one high-fidelity enterprise ecosystem." },
    { name: "keywords", content: "e-procurement, procurement, B2B, vendor marketplace, RFQ, purchase order, Indonesia B2B" },
    { rel: "canonical", href: "https://app.huntr.id/" },
    // Open Graph
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://app.huntr.id/" },
    { property: "og:title", content: "Huntr.id - Enterprise B2B E-Procurement Ecosystem" },
    { property: "og:description", content: "Connect with verified vendors, streamline your RFQ process, and manage purchase orders in one high-fidelity enterprise ecosystem." },
    { property: "og:image", content: "https://app.huntr.id/assets/img/logo/sidebar.png" },
    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: "https://app.huntr.id/" },
    { name: "twitter:title", content: "Huntr.id - Enterprise B2B E-Procurement Ecosystem" },
    { name: "twitter:description", content: "Connect with verified vendors, streamline your RFQ process, and manage purchase orders in one high-fidelity enterprise ecosystem." },
    { name: "twitter:image", content: "https://app.huntr.id/assets/img/logo/sidebar.png" },
  ];
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vendorBuyerActive, setVendorBuyerActive] = useState(false);

  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    const companySession = localStorage.getItem("active_company");
    if (userSession) setUser(JSON.parse(userSession));
    if (companySession) setActiveCompany(JSON.parse(companySession));
    setVendorBuyerActive(isVendorBuyerMode());
    setLoading(false);

    const handleModeChange = (e: any) => {
      setVendorBuyerActive(e?.detail?.enabled ?? isVendorBuyerMode());
    };
    window.addEventListener(VENDOR_BUYER_MODE_EVENT, handleModeChange);
    window.addEventListener("storage", handleModeChange);
    return () => {
      window.removeEventListener(VENDOR_BUYER_MODE_EVENT, handleModeChange);
      window.removeEventListener("storage", handleModeChange);
    };
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  if (user && activeCompany) {
    if (activeCompany.type === "buyer" || vendorBuyerActive) {
      return <BuyerDashboard user={user} activeCompany={activeCompany} />;
    }
    return <VendorEbiddingDashboard user={user} activeCompany={activeCompany} />;
  }

  return <GuestMarketplaceView />;
}
