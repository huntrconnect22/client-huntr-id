import React, { useEffect, useState } from "react";
import type { MetaFunction } from "react-router";
import { PageSkeleton } from "../components/dashboard/PageSkeleton";
import { BuyerDashboard } from "../components/dashboard/BuyerDashboard";
import { VendorEbiddingDashboard } from "../components/dashboard/VendorEbiddingDashboard";
import { GuestMarketplaceView } from "../components/dashboard/GuestMarketplaceView";



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

  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    const companySession = localStorage.getItem("active_company");
    if (userSession) setUser(JSON.parse(userSession));
    if (companySession) setActiveCompany(JSON.parse(companySession));
    setLoading(false);
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  if (user && activeCompany) {
    // Route to dashboard based purely on workspace type
    if (activeCompany.type === "buyer") {
      return <BuyerDashboard user={user} activeCompany={activeCompany} />;
    }
    return <VendorEbiddingDashboard user={user} activeCompany={activeCompany} />;
  }

  return <GuestMarketplaceView />;
}
