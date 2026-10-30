import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowDownAZ, Bell, ChevronDown, ClipboardList, ExternalLink, LoaderCircle, Newspaper, Search, Sparkles, X } from "lucide-react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import ButtonBase from "@mui/material/ButtonBase";
import InputBase from "@mui/material/InputBase";
import { useLanguage } from "~/context/LanguageContext";
import WeatherWidget from "~/components/WeatherWidget";
import { askHuntrAssist, type HuntrAssistResponse } from "~/modules/shared/api/ai";
import type { NavItemConfig } from "./navigation";
import { UserMenuDropdown } from "./UserMenuDropdown";
import { MainMenuNews } from "./MainMenuNews";

interface AppDrawerProps {
  navItems: NavItemConfig[];
  pathname: string;
  pendingCounts: Record<string, number>;
  unreadCount?: number;
  companyId?: string;
  user?: any;
  activeCompany?: any;
  isVendorComp?: boolean;
  isBuyerComp?: boolean;
  counterpartBuyer?: any;
  counterpartVendor?: any;
  rejectedCounterpart?: any;
  switchingWorkspace?: boolean;
  onSwitchWorkspace?: (targetCompany: any) => void;
  onLogout?: () => void;
  open: boolean;
  onClose: () => void;
  onNavigate: () => void;
}
const sectionLabels: Record<string, string> = {
  main: "Workspace", procurement: "Procurement", vendor: "Vendor",
  orders: "Order & documents", finance: "Finance", settings: "Settings",
};

const appIconTones = {
  blue: { main: "#2563eb", surface: "rgba(37, 99, 235, 0.11)", border: "rgba(37, 99, 235, 0.22)" },
  indigo: { main: "#4f46e5", surface: "rgba(79, 70, 229, 0.11)", border: "rgba(79, 70, 229, 0.22)" },
  teal: { main: "#0f766e", surface: "rgba(13, 148, 136, 0.12)", border: "rgba(13, 148, 136, 0.24)" },
  violet: { main: "#7c3aed", surface: "rgba(124, 58, 237, 0.11)", border: "rgba(124, 58, 237, 0.22)" },
  amber: { main: "#b45309", surface: "rgba(217, 119, 6, 0.12)", border: "rgba(217, 119, 6, 0.24)" },
  emerald: { main: "#047857", surface: "rgba(5, 150, 105, 0.11)", border: "rgba(5, 150, 105, 0.23)" },
  slate: { main: "#475569", surface: "rgba(71, 85, 105, 0.11)", border: "rgba(71, 85, 105, 0.22)" },
};

function getAppIconTone(section: string, to: string) {
  if (to.includes("/wms")) return appIconTones.teal;
  if (to.includes("/crm")) return appIconTones.violet;
  if (to.includes("/budgeting")) return appIconTones.amber;
  if (to.includes("/apps")) return appIconTones.indigo;
  if (to.includes("/tasks")) return appIconTones.blue;
  if (section === "procurement") return appIconTones.amber;
  if (section === "vendor") return appIconTones.teal;
  if (section === "orders") return appIconTones.violet;
  if (section === "finance") return appIconTones.emerald;
  if (section === "settings") return appIconTones.slate;
  return appIconTones.blue;
}

export function AppDrawer({ navItems, pathname, pendingCounts, unreadCount = 0, companyId, user, activeCompany, isVendorComp = false, isBuyerComp = false, counterpartBuyer, counterpartVendor, rejectedCounterpart, switchingWorkspace = false, onSwitchWorkspace = () => undefined, onLogout = () => undefined, open, onClose, onNavigate }: AppDrawerProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [initialFilter, setInitialFilter] = useState("all");
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [assist, setAssist] = useState<HuntrAssistResponse | null>(null);
  const [assistError, setAssistError] = useState("");
  const [assistLoading, setAssistLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [surface, setSurface] = useState<"apps" | "news">("apps");
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const grouped = navItems.reduce<Record<string, NavItemConfig[]>>((groups, item) => {
    (groups[item.section] ??= []).push(item);
    return groups;
  }, {});
  const menuItems = Object.entries(grouped)
    .filter(([section]) => section !== "orders")
    .flatMap(([section, items]) => {
      if (section !== "procurement" || items.length === 0) {
        return items;
      }

      // Procurement has many operational surfaces. Keep Main Menu focused on
      // choosing a workspace; its detailed tools are revealed in the contextual
      // bottom navigation once the user enters Procurement.
      const procurementHome =
        items.find((item) => item.to.endsWith("/my-pr")) ?? items[0];

      return [{
        ...procurementHome,
        label: "Procurement",
        labelKey: undefined,
        Icon: ClipboardList,
        badge: undefined,
      }];
    });
  const sections = useMemo(() => Array.from(new Set(menuItems.map((item) => item.section))), [menuItems]);
  const initials = useMemo(() => Array.from(new Set(menuItems.map((item) => (item.labelKey ? t(item.labelKey) : item.label).charAt(0).toUpperCase()))).sort(), [menuItems, t]);
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    const result = menuItems.filter((item) => {
      const label = item.labelKey ? t(item.labelKey) : item.label;
      return (sectionFilter === "all" || item.section === sectionFilter)
        && (initialFilter === "all" || label.toUpperCase().startsWith(initialFilter))
        && (!normalizedQuery || label.toLocaleLowerCase("id-ID").includes(normalizedQuery));
    });

    return sortAlphabetically
      ? [...result].sort((a, b) => (a.labelKey ? t(a.labelKey) : a.label).localeCompare(b.labelKey ? t(b.labelKey) : b.label, "id"))
      : result;
  }, [initialFilter, menuItems, query, sectionFilter, sortAlphabetically, t]);

  const askAssist = async () => {
    const prompt = query.trim();
    if (prompt.length < 2 || assistLoading) return;

    setAssistLoading(true);
    setAssistError("");
    try {
      const response = await askHuntrAssist(prompt, {
        company_id: companyId,
        previous_response_id: assist?.response_id ?? undefined,
      });
      setAssist(response);
    } catch (error: any) {
      setAssistError(error?.message || "Huntr Assist belum dapat menjawab. Coba lagi nanti.");
    } finally {
      setAssistLoading(false);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const horizontalDistance = touch.clientX - start.x;
    const verticalDistance = touch.clientY - start.y;
    if (Math.abs(horizontalDistance) < 72 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return;

    if (surface === "apps" && horizontalDistance > 0) setSurface("news");
    if (surface === "news" && horizontalDistance < 0) setSurface("apps");
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose} aria-labelledby="main-menu-title"
      slotProps={{ paper: { sx: { bgcolor: "background.default", borderRadius: 0 } } }}>
      <DialogTitle component="div" sx={{ width: "100%", maxWidth: 1280, mx: "auto", px: { xs: 2, sm: 4 }, pt: { xs: 2, sm: 3 }, pb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 750, letterSpacing: "0.12em" }}>Huntr platform</Typography>
          <Typography id="main-menu-title" component="h2" variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.03em" }}>{surface === "news" ? "Berita" : "Aplikasi"}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <ButtonBase type="button" onClick={() => setSurface((current) => current === "apps" ? "news" : "apps")} aria-label={surface === "apps" ? "Buka berita ekonomi dan politik" : "Kembali ke aplikasi"} sx={{ minHeight: 42, px: { xs: 1, sm: 1.25 }, gap: 0.5, border: 1, borderColor: surface === "news" ? "primary.main" : "divider", borderRadius: 1.5, bgcolor: surface === "news" ? "primary.light" : "background.paper", color: surface === "news" ? "primary.dark" : "text.primary", fontSize: 13, fontWeight: 750 }}>
            <Newspaper size={18} /><Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Berita</Box>
          </ButtonBase>
          {user && (
            <Box sx={{ position: "relative" }}>
              <ButtonBase
                type="button"
                onClick={() => setUserMenuOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                sx={{ minHeight: 42, maxWidth: { xs: 44, sm: 220 }, px: { xs: 0.5, sm: 1 }, gap: 0.75, border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: "background.paper", color: "text.primary" }}
              >
                <Box sx={{ width: 30, height: 30, flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center", borderRadius: 1, bgcolor: "primary.main", color: "primary.contrastText", fontSize: 12, fontWeight: 800 }}>
                  {user.profile_photo_url ? <Box component="img" src={user.profile_photo_url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user.name?.[0]?.toUpperCase() || "U")}
                </Box>
                <Box sx={{ minWidth: 0, display: { xs: "none", sm: "block" }, textAlign: "left" }}>
                  <Typography noWrap variant="body2" sx={{ maxWidth: 140, fontWeight: 750, lineHeight: 1.15 }}>{user.name || "User"}</Typography>
                  <Typography noWrap variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 140 }}>{activeCompany?.name || "Workspace"}</Typography>
                </Box>
                <ChevronDown size={16} />
              </ButtonBase>
              {userMenuOpen && (
                <UserMenuDropdown
                  user={user}
                  activeCompany={activeCompany}
                  isVendorComp={isVendorComp}
                  isBuyerComp={isBuyerComp}
                  counterpartBuyer={counterpartBuyer}
                  counterpartVendor={counterpartVendor}
                  rejectedCounterpart={rejectedCounterpart}
                  switchingWorkspace={switchingWorkspace}
                  onSwitchWorkspace={onSwitchWorkspace}
                  onLogout={onLogout}
                  onClose={() => setUserMenuOpen(false)}
                />
              )}
            </Box>
          )}
          <IconButton onClick={onClose} aria-label={t("common.close")}><X size={24} /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent onTouchStart={(event) => { const touch = event.touches[0]; swipeStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={handleTouchEnd} sx={{ width: "100%", maxWidth: 1280, mx: "auto", px: { xs: 2, sm: 4 }, py: { xs: 1.5, sm: 2 } }}>
        {surface === "news" ? <MainMenuNews onBack={() => setSurface("apps")} /> : <>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" }, gap: 1, alignItems: "center", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 46, px: 1.5, border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: "background.paper", "&:focus-within": { borderColor: "primary.main", boxShadow: "0 0 0 2px rgba(37,99,235,0.12)" } }}>
            <Search size={19} color="currentColor" />
            <InputBase value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void askAssist(); } }} placeholder="Cari aplikasi atau tanya Huntr Assist" inputProps={{ "aria-label": "Cari aplikasi atau tanya Huntr Assist" }} sx={{ flex: 1, fontSize: 14, fontWeight: 600 }} />
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <ButtonBase type="button" onClick={() => void askAssist()} disabled={query.trim().length < 2 || assistLoading}
              sx={{ minHeight: 46, px: 1.5, gap: 0.75, border: 1, borderColor: "primary.main", borderRadius: 1.5, bgcolor: "primary.main", color: "primary.contrastText", fontSize: 13, fontWeight: 750, whiteSpace: "nowrap", "&.Mui-disabled": { opacity: 0.45 }, "&:hover": { bgcolor: "primary.dark" } }}>
              {assistLoading ? <LoaderCircle className="animate-spin" size={18} /> : <Sparkles size={18} />} <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Tanya </Box>Assist
            </ButtonBase>
            <ButtonBase type="button" onClick={() => setSortAlphabetically((value) => !value)} aria-pressed={sortAlphabetically}
              sx={{ minHeight: 46, minWidth: 46, px: 1.25, gap: 0.75, border: 1, borderColor: sortAlphabetically ? "primary.main" : "divider", borderRadius: 1.5, bgcolor: sortAlphabetically ? "primary.light" : "background.paper", color: sortAlphabetically ? "primary.dark" : "text.primary", fontSize: 13, fontWeight: 750, whiteSpace: "nowrap" }}>
              <ArrowDownAZ size={18} /><Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>{sortAlphabetically ? "A–Z" : "Urutkan"}</Box>
            </ButtonBase>
          </Box>
        </Box>

        {(assist || assistError) && (
          <Box role="status" sx={{ mb: 1.5, p: { xs: 1.5, sm: 2 }, border: 1, borderColor: assistError ? "error.light" : "primary.light", borderRadius: 1.5, bgcolor: assistError ? "error.lighter" : "primary.lighter" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: assist?.answer ? 1 : 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: assistError ? "error.main" : "primary.main" }}><Sparkles size={17} /><Typography variant="body2" sx={{ fontWeight: 800 }}>Huntr Assist{assist?.provider === "huntr_platform" ? " · Data platform" : assist?.fallback ? " · OpenAI fallback" : " · Web grounded"}</Typography></Box>
              <ButtonBase type="button" onClick={() => { setAssist(null); setAssistError(""); }} sx={{ px: 0.75, py: 0.25, borderRadius: 1, color: "text.secondary", fontSize: 12, fontWeight: 700 }}>Tutup</ButtonBase>
            </Box>
            {assistError ? <Typography variant="body2" color="error.main">{assistError}</Typography> : <>
              {assist?.fallback && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>Perplexity tidak tersedia; jawaban ini dibuat oleh OpenAI tanpa pencarian web langsung.</Typography>}
              <Typography component="p" variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65, mb: assist?.sources?.length ? 1.25 : 0 }}>{assist?.answer}</Typography>
              {!!assist?.sources?.length && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {assist.sources.map((source) => <ButtonBase key={source.url} component="a" href={source.url} target="_blank" rel="noreferrer" sx={{ maxWidth: "100%", px: 1, py: 0.6, gap: 0.5, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.paper", color: "text.secondary", fontSize: 12, fontWeight: 650, textAlign: "left", "&:hover": { color: "primary.main", borderColor: "primary.main" } }}><ExternalLink size={13} /><Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source.title}</Box></ButtonBase>)}
              </Box>}
            </>}
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, overflowX: "auto", p: 0.75, mb: 1.5, border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: "background.paper", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
          <ButtonBase type="button" onClick={() => setSectionFilter("all")} sx={{ flex: "0 0 auto", minHeight: 32, px: 1.25, borderRadius: 1, bgcolor: sectionFilter === "all" ? "primary.main" : "transparent", color: sectionFilter === "all" ? "primary.contrastText" : "text.secondary", fontSize: 12, fontWeight: 750 }}>Semua</ButtonBase>
          {sections.map((section) => (
            <ButtonBase key={section} type="button" onClick={() => setSectionFilter(section)} sx={{ flex: "0 0 auto", minHeight: 32, px: 1.25, borderRadius: 1, bgcolor: sectionFilter === section ? "primary.light" : "transparent", color: sectionFilter === section ? "primary.dark" : "text.secondary", fontSize: 12, fontWeight: 750 }}>{sectionLabels[section] ?? section}</ButtonBase>
          ))}
          <Box aria-hidden="true" sx={{ flex: "0 0 1px", width: 1, height: 18, bgcolor: "divider", mx: 0.25 }} />
          <ButtonBase type="button" onClick={() => setInitialFilter("all")} aria-label="Tampilkan semua huruf" sx={{ flex: "0 0 auto", minWidth: 30, height: 30, borderRadius: 1, bgcolor: initialFilter === "all" ? "action.selected" : "transparent", fontSize: 11, fontWeight: 800 }}>#</ButtonBase>
          {initials.map((initial) => (
            <ButtonBase key={initial} type="button" onClick={() => setInitialFilter(initial)} aria-pressed={initialFilter === initial} sx={{ flex: "0 0 auto", minWidth: 30, height: 30, borderRadius: 1, bgcolor: initialFilter === initial ? "action.selected" : "transparent", color: initialFilter === initial ? "primary.main" : "text.secondary", fontSize: 11, fontWeight: 800 }}>{initial}</ButtonBase>
          ))}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.45fr) minmax(270px, 0.55fr)" }, gap: 1.5, mb: 3 }}>
          <WeatherWidget embedded compact />
          <CardActionArea component={Link} to="/notifications" onClick={onNavigate}
            aria-label={unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Buka notifikasi"}
            sx={{ minHeight: 96, p: 2, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 1.5, borderRadius: 1.5, border: 1, borderColor: "divider", bgcolor: "background.paper", color: "text.primary", "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" }, "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 } }}>
            <Badge badgeContent={unreadCount} color="primary" max={99}>
              <Box aria-hidden="true" sx={{ width: 46, height: 46, display: "grid", placeItems: "center", borderRadius: 1.5, bgcolor: "primary.light", color: "primary.dark" }}><Bell size={23} /></Box>
            </Badge>
            <Box sx={{ textAlign: "left", minWidth: 0 }}>
              <Typography sx={{ fontWeight: 750 }}>Notifikasi</Typography>
              <Typography variant="body2" color="text.secondary">{unreadCount > 0 ? `${unreadCount} belum dibaca` : "Tidak ada yang baru"}</Typography>
            </Box>
          </CardActionArea>
        </Box>
        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2, mb: 1.25 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{visibleItems.length} aplikasi tersedia</Typography>
          {(query || sectionFilter !== "all" || initialFilter !== "all") && <ButtonBase type="button" onClick={() => { setQuery(""); setSectionFilter("all"); setInitialFilter("all"); setAssist(null); setAssistError(""); }} sx={{ color: "primary.main", fontSize: 12, fontWeight: 750 }}>Reset filter</ButtonBase>}
        </Box>
        {visibleItems.length > 0 ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 210px), 1fr))", gap: { xs: 1, sm: 1.25 }, pb: 4 }}>
            {visibleItems.map(({ to, label, labelKey, Icon, exact, badge, section }) => {
              const active = pathname === to || (!exact && to !== "/" && pathname.startsWith(`${to}/`));
              const tone = getAppIconTone(section, to);
              return (
                <CardActionArea key={to} component={Link} to={to} onClick={onNavigate} aria-current={active ? "page" : undefined}
                  sx={{ minHeight: { xs: 100, sm: 108 }, p: 1.5, display: "grid", gridTemplateColumns: "48px minmax(0, 1fr)", alignItems: "center", gap: 1.25, borderRadius: 1.5, border: 1, borderColor: active ? tone.main : "divider", bgcolor: active ? tone.surface : "background.paper", color: "text.primary", transition: "transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease", "&:hover": { borderColor: tone.main, transform: "translateY(-2px)", boxShadow: `0 6px 16px ${tone.surface}` }, "&.Mui-focusVisible": { outline: `2px solid ${tone.main}`, outlineOffset: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Badge badgeContent={badge ? pendingCounts[badge] ?? 0 : 0} color="primary" max={99}>
                      <Box aria-hidden="true" sx={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 1.5, bgcolor: tone.main, border: "none", boxShadow: `0 8px 18px -10px ${tone.main}`, color: "#fff" }}><Icon size={24} strokeWidth={2} /></Box>
                    </Badge>
                  </Box>
                  <Box sx={{ minWidth: 0, display: "grid", gap: 0.35, textAlign: "left" }}>
                    <Typography noWrap variant="caption" sx={{ color: "text.secondary", fontSize: "0.625rem", fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase" }}>{sectionLabels[section] ?? section}</Typography>
                    <Typography variant="body2" sx={{ maxWidth: "100%", fontWeight: 800, lineHeight: 1.25 }}>{labelKey ? t(labelKey) : label}</Typography>
                  </Box>
                </CardActionArea>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ py: 8, textAlign: "center", border: 1, borderColor: "divider", borderStyle: "dashed", borderRadius: 1.5 }}>
            <Typography sx={{ fontWeight: 750 }}>Aplikasi tidak ditemukan</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Coba kata kunci atau filter lain.</Typography>
          </Box>
        )}
        </>}
      </DialogContent>
    </Dialog>
  );
}
