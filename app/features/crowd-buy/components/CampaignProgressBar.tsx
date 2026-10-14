import React from "react";

interface CampaignProgressBarProps {
  current: number;
  target: number;
  max?: number | null;
  unit: string;
  percentage: number;
  isTargetReached: boolean;
  showLabels?: boolean;
}

export const CampaignProgressBar: React.FC<CampaignProgressBarProps> = ({
  current,
  target,
  max,
  unit,
  percentage,
  isTargetReached,
  showLabels = true,
}) => {
  const cappedPercentage = Math.min(percentage, 100);

  return (
    <div className="w-full space-y-1">
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            Terkumpul: <strong className="text-slate-900 dark:text-white font-semibold">{current.toLocaleString("id-ID")}</strong> / {target.toLocaleString("id-ID")} {unit}
          </span>
          <span className={`font-semibold ${isTargetReached ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}>
            {percentage}%
          </span>
        </div>
      )}

      {/* Flat Progress Track */}
      <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-sm ${
            isTargetReached ? "bg-emerald-500" : "bg-orange-500"
          }`}
          style={{ width: `${cappedPercentage}%` }}
        />
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Target Min: {target.toLocaleString("id-ID")} {unit}</span>
          {max ? (
            <span>Maks: {max.toLocaleString("id-ID")} {unit}</span>
          ) : (
            <span>Tanpa batas maks</span>
          )}
        </div>
      )}
    </div>
  );
};
