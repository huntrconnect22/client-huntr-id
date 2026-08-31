import React from "react";
import { Trophy } from "lucide-react";
import { VendorRankingCard } from "./VendorRankingCard";

interface VendorRankingsListProps {
  rankings: any[];
  recommendedWinnerId?: string | null;
}

export const VendorRankingsList: React.FC<VendorRankingsListProps> = ({
  rankings = [],
  recommendedWinnerId,
}) => {
  if (rankings.length === 0) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div
          style={{
            padding: 10,
            borderRadius: 12,
            background: "rgba(249,115,22,0.1)",
            color: "var(--huntr-orange)",
          }}
        >
          <Trophy size={20} />
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 800,
            color: "var(--ui-text-primary)",
          }}
        >
          Vendor Proposals & Detailed Analysis
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {rankings.map((rankData: any, index: number) => (
          <VendorRankingCard
            key={rankData.proposal_id || rankData.proposal?.id || index}
            rankData={rankData}
            index={index}
            recommendedWinnerId={recommendedWinnerId}
          />
        ))}
      </div>
    </div>
  );
};
