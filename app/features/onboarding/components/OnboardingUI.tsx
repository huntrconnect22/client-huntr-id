import React from "react";

/**
 * SlideSection Component
 * 
 * Wadah untuk setiap langkah onboarding dengan animasi dan identitas visual.
 */
export const SlideSection = ({ title, subtitle, icon, children, accentColor }: any) => (
  <div className="flex flex-col gap-6 animate-fade-in">
    <div className="flex items-center gap-3 md:gap-4">
      <div 
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors bg-orange-500/10 border border-orange-500/20 text-orange-400"
      >
        {icon}
      </div>
      <div>
        <h2 className="text-lg md:text-xl font-extrabold text-[var(--ui-text-primary)] leading-tight tracking-tight">{title}</h2>
        <p className="text-xs text-[var(--ui-text-secondary)] mt-0.5">{subtitle}</p>
      </div>
    </div>
    <div className="flex flex-col gap-5">{children}</div>
  </div>
);

/**
 * Field Component
 * 
 * Komponen input standar dengan label yang konsisten.
 */
export const Field = ({ label, value, onChange, placeholder, type = "text" }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] md:text-[11px] font-bold text-[var(--ui-text-muted)] uppercase tracking-wider">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none text-sm transition-all focus:border-orange-500/50 focus:bg-[var(--ui-bg-input-focus)]"
    />
  </div>
);

/**
 * FormLabel Component
 * 
 * Label kecil yang digunakan secara konsisten di seluruh form.
 */
export const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[10px] md:text-[11px] font-bold text-[var(--ui-text-muted)] uppercase tracking-wider">
    {children}
  </label>
);
