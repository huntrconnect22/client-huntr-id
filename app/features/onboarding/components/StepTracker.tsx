import React from "react";
import { CheckCircle2 } from "lucide-react";

interface StepTrackerProps {
  steps: any[];
  currentSlide: number;
}

/**
 * StepTracker Component
 * 
 * Menampilkan progress langkah onboarding.
 */
export const StepTracker: React.FC<StepTrackerProps> = ({ steps, currentSlide }) => {
  return (
    <div className="mb-6 md:mb-10 px-1">
      <div className="flex items-center justify-between relative">
        {steps.map((step, i) => {
          const isDone = currentSlide > step.id;
          const isActive = currentSlide === step.id;
          const Icon = step.icon;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1 relative z-1">
                <div 
                  className={`
                    w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-300
                    ${isDone 
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-500/40 text-white shadow-md shadow-emerald-500/20" 
                      : isActive 
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-500/50 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/20" 
                        : "bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-muted)]"
                    }
                  `}
                >
                  {isDone ? <CheckCircle2 size={17} className="text-white" /> : <Icon size={16} className={isActive ? "text-white" : "text-[var(--ui-text-muted)]"} />}
                </div>
                <div className="mt-2 text-center">
                  <div className={`
                    text-[10px] font-semibold tracking-tight transition-colors duration-300 whitespace-nowrap hidden md:block
                    ${isDone ? "text-emerald-400" : isActive ? "text-orange-400 font-bold" : "text-[var(--ui-text-muted)]"}
                  `}>
                    {step.label}
                  </div>
                  {/* Mobile minimal label */}
                  {isActive && (
                    <div className="text-[9px] font-bold text-orange-400 uppercase tracking-wider md:hidden absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      {step.label}
                    </div>
                  )}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={`
                  flex-1 h-[2px] -mt-4 transition-all duration-500 rounded-full
                  ${currentSlide > step.id ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-[var(--ui-border)]"}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
