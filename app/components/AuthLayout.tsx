import React from "react";
import { FileText, Building2, ClipboardList, FileCheck2, User, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

type FeatureVariant = "orange" | "amber" | "indigo" | "purple";

interface AuthLayoutProps {
  variant?: "login" | "register";
  visualTitle: string;
  visualText: string;
  features: string[];
  featureVariant?: FeatureVariant;
  children: React.ReactNode;
}

export default function AuthLayout({
  variant = "login",
  visualTitle,
  visualText,
  features,
  children,
}: AuthLayoutProps) {
  const isRegister = variant === "register";

  return (
    <div className="min-h-screen flex w-full bg-[var(--ui-bg-page-grad)] relative overflow-x-hidden">
      {/* Background ambient lighting blur effects */}
      <div className="fixed top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[35%] w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none z-0" />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen">
        {/* Top Header Navigation */}
        <header className="w-full px-6 py-5 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/img/logo/sidebar.png" 
              alt="HUNTR" 
              className="h-9 sm:h-10 w-auto object-contain" 
            />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>
        
        {/* Form Content Area */}
        <main className="flex-1 flex items-center justify-center px-4 py-6 md:px-8 sm:py-8">
          <div className="w-full max-w-[460px] mx-auto">
            {/* Card wrapper */}
            <div className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-black/10 backdrop-blur-xl relative">
              {children}
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="py-4 text-center text-xs text-[var(--ui-text-muted)] font-medium">
          &copy; 2026 Huntr.id &bull; Enterprise B2B Procurement Platform
        </footer>
      </div>

      {/* Right Side: Hero Visual Panel (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative overflow-hidden bg-slate-950 border-l border-[var(--ui-border)]">
        <img
          src="/assets/img/auth-assets/enterprise-building.jpg"
          alt="Enterprise building"
          className="absolute inset-0 w-full h-full object-cover opacity-35 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/75 to-orange-950/40" />
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-400/90 bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 rounded-full w-fit backdrop-blur-md">
            <Sparkles size={13} /> Official Procurement Network
          </div>

          {!isRegister ? (
            <div className="max-w-[500px]">
              <h2 className="text-3xl xl:text-4xl font-black text-white mb-4 leading-tight tracking-tight">
                {visualTitle}
              </h2>
              <p className="text-slate-300 text-base mb-8 leading-relaxed font-normal">
                {visualText}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {features.map((feature) => (
                  <span
                    key={feature}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white border border-white/15 backdrop-blur-md flex items-center gap-1.5"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-[500px]">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Syarat Kelengkapan Berkas
                  </h3>
                  <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20">
                    Onboarding Phase
                  </span>
                </div>
                <ul className="space-y-3.5">
                  {[
                    { icon: FileText, text: "NIB (Nomor Induk Berusaha)" },
                    { icon: Building2, text: "NPWP (Nomor Pokok Wajib Pajak)" },
                    { icon: ClipboardList, text: "SIUP / Izin Usaha Terkait" },
                    { icon: FileCheck2, text: "Akta Pendirian Perusahaan" },
                    { icon: User, text: "KTP Penanggung Jawab" },
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-3.5 hover:border-orange-500/30 transition-all">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                          <item.icon size={18} />
                        </div>
                        <span className="text-sm text-slate-200 font-semibold">{item.text}</span>
                      </div>
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 opacity-70" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Bottom testimonial badge */}
          <div className="flex items-center gap-4 pt-6 border-t border-white/10">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white">PJ</div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white">MA</div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white">HD</div>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Trusted by <span className="text-white font-bold">500+ verified enterprise companies</span> across Indonesia.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

