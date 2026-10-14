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
    <div className="w-full space-y-1.5">
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Terkumpul: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{current.toLocaleString("id-ID")}</strong> / {target.toLocaleString("id-ID")} {unit}
          </span>
          <span className={`font-semibold ${isTargetReached ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
            {percentage}%
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-700 ease-out rounded-full ${
            isTargetReached
              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
              : "bg-gradient-to-r from-indigo-500 to-cyan-500"
          }`}
          style={{ width: `${cappedPercentage}%` }}
        />
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
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
