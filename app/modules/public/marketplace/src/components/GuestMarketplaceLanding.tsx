import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, Building2, CheckCircle2, ChevronLeft, ChevronRight, Menu, Package, Search, ShieldCheck, Sparkles, Store, Truck, X } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getCatalogues } from "~/lib/api";
import { getAssetUrl } from "~/lib/assets";
import { aiSearch, isAiQuery } from "~/lib/api/ai";
import "./GuestMarketplaceLanding.css";

const categories = ["All", "Hardware", "Software", "Furniture", "Office Supplies", "Services", "Electronics", "Mechanical", "Construction", "Other"];
type Product = { id: string; name?: string; category?: string; image_url?: string; image_path?: string; company?: { name?: string } };

function Brand() { return <Link className="guest-brand" to="/" aria-label="Huntr home"><span>H</span><strong>HUNTR</strong></Link>; }

export function GuestMarketplaceLanding() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "All";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [query, setQuery] = useState(search);
  const [items, setItems] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  useEffect(() => setQuery(search), [search]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query === search) return;
      setParams(current => { if (query.trim()) current.set("search", query.trim()); else current.delete("search"); current.set("page", "1"); return current; });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, search, setParams]);
  useEffect(() => {
    let active = true;
    setLoading(true); setAiNote(null);
    getCatalogues({ search: search || undefined, category: category === "All" ? undefined : category, page, per_page: 12 })
      .then(response => { if (!active) return; setItems(Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []); setTotalPages(Math.max(1, Number(response?.last_page) || 1)); })
      .catch(() => active && setItems([])).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [search, category, page]);
  useEffect(() => {
    if (!isAiQuery(search)) return;
    let active = true;
    const timer = window.setTimeout(() => aiSearch(search).then(result => {
      if (!active || !result?.success) return;
      setAiNote(result.ai_summary || "Kami telah menyusun hasil berdasarkan spesifikasi yang Anda cari.");
      if (Array.isArray(result.data) && result.data.length) setItems(result.data);
    }).catch(() => undefined), 600);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search]);
  const changeCategory = (next: string) => setParams(current => { if (next === "All") current.delete("category"); else current.set("category", next); current.set("page", "1"); return current; });
  const changePage = (next: number) => setParams(current => { current.set("page", String(next)); return current; });

  return <Box className="guest-marketplace">
    <header className="guest-header"><Container className="guest-header-inner" maxWidth="xl"><Brand />
      <nav className={`guest-nav ${mobileMenu ? "guest-nav--open" : ""}`} aria-label="Public navigation"><Link to="/crowd-buy">Crowd Buy</Link><Link to="/track">Lacak pesanan</Link><Link to="/verify">Verifikasi dokumen</Link><Link to="/register">Untuk vendor</Link></nav>
      <Stack className="guest-account-actions" direction="row" spacing={1}><Button component={Link} to="/login" variant="text">Masuk</Button><Button component={Link} to="/register" variant="contained">Mulai sekarang</Button></Stack>
      <IconButton className="guest-menu-button" onClick={() => setMobileMenu(value => !value)} aria-label="Buka menu">{mobileMenu ? <X /> : <Menu />}</IconButton>
    </Container></header>
    <main>
      <section className="guest-hero"><Container maxWidth="xl" className="guest-hero-grid"><Box className="guest-hero-copy">
        <Typography className="guest-eyebrow">Platform procurement terintegrasi</Typography><Typography component="h1">Pengadaan bisnis yang lebih jelas, terukur, dan cepat.</Typography><Typography className="guest-hero-description">Temukan produk dari vendor terverifikasi, susun permintaan, dan kelola proses pembelian dalam satu alur kerja.</Typography>
        <Box className="guest-search" component="form" onSubmit={event => { event.preventDefault(); setQuery(query.trim()); }}><Search size={21} aria-hidden="true" /><InputBase value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari produk, kategori, atau kebutuhan bisnis" inputProps={{ "aria-label": "Cari katalog" }} /><Button type="submit" variant="contained" endIcon={<ArrowRight size={17} />}>Cari</Button></Box>
        <Stack direction="row" className="guest-trust" spacing={3}><span><CheckCircle2 size={16} /> Vendor terverifikasi</span><span><ShieldCheck size={16} /> Transaksi terdokumentasi</span></Stack>
      </Box><Box className="guest-hero-panel" aria-label="Procurement workflow"><div className="guest-panel-header"><span className="guest-panel-icon"><Store size={21} /></span><div><strong>Marketplace B2B</strong><span>Siap untuk kebutuhan procurement</span></div></div>
        {[{ Icon: Search, title: "Temukan kebutuhan", sub: "Katalog lintas kategori" }, { Icon: Building2, title: "Evaluasi vendor", sub: "Data vendor dalam satu tempat" }, { Icon: Truck, title: "Lanjutkan pembelian", sub: "Dari permintaan hingga pesanan" }].map(({ Icon, title, sub }, index) => <div className="guest-flow-row" key={title}><span>{index + 1}</span><Icon size={18} /><div><strong>{title}</strong><small>{sub}</small></div></div>)}
      </Box></Container></section>
      <section className="guest-catalogue-section"><Container maxWidth="xl"><Box className="guest-section-heading"><div><Typography component="p" className="guest-eyebrow">Marketplace</Typography><Typography component="h2">Jelajahi katalog</Typography></div><Typography>Produk dan layanan untuk operasional bisnis Anda.</Typography></Box>
        <Box className="guest-category-row" aria-label="Kategori katalog">{categories.map(item => <Chip key={item} label={item} onClick={() => changeCategory(item)} color={category === item ? "primary" : "default"} variant={category === item ? "filled" : "outlined"} />)}</Box>
        {aiNote && <Box className="guest-ai-note"><Sparkles size={18} /><div><strong>Hasil pencarian cerdas</strong><span>{aiNote}</span></div></Box>}
        <Box className="guest-product-meta"><Typography component="h3">{search ? `Hasil untuk “${search}”` : "Rekomendasi untuk Anda"}</Typography><Typography>{loading ? "Memuat katalog…" : `${items.length} item ditampilkan`}</Typography></Box>
        <Box className="guest-product-grid">{loading ? Array.from({ length: 8 }, (_, index) => <Card key={index} className="guest-product-card"><Skeleton variant="rectangular" height={180} /><Box sx={{ p: 2 }}><Skeleton width="40%" /><Skeleton /><Skeleton width="70%" /></Box></Card>) : items.map(item => <Card className="guest-product-card" key={item.id} variant="outlined"><CardActionArea onClick={() => navigate(`/marketplace/${item.id}`)}><Box className="guest-product-image">{item.image_url || item.image_path ? <img src={getAssetUrl(item.image_url || item.image_path)} alt="" onError={event => { event.currentTarget.style.display = "none"; }} /> : null}<Package className="guest-product-placeholder" size={34} /></Box><Box className="guest-product-copy"><span>{item.category || "Katalog"}</span><Typography component="h3">{item.name || "Produk tanpa nama"}</Typography><Typography>{item.company?.name || "Vendor Huntr"}</Typography></Box></CardActionArea></Card>)}</Box>
        {!loading && !items.length && <Box className="guest-empty"><Package size={34} /><Typography component="h3">Produk belum ditemukan</Typography><Typography>Ubah kata kunci atau pilih kategori lain.</Typography><Button onClick={() => { setQuery(""); changeCategory("All"); }} variant="outlined">Reset pencarian</Button></Box>}
        {totalPages > 1 && <Stack className="guest-pagination" direction="row" spacing={1} sx={{ justifyContent: "center" }}><Button onClick={() => changePage(page - 1)} disabled={page === 1} startIcon={<ChevronLeft size={17} />}>Sebelumnya</Button><Typography>{page} / {totalPages}</Typography><Button onClick={() => changePage(page + 1)} disabled={page === totalPages} endIcon={<ChevronRight size={17} />}>Berikutnya</Button></Stack>}
      </Container></section>
      <section className="guest-cta"><Container maxWidth="xl" className="guest-cta-inner"><Box><Typography component="h2">Mulai kelola procurement dengan alur yang lebih rapi.</Typography><Typography>Daftarkan perusahaan Anda untuk membuat permintaan, berkolaborasi dengan tim, dan mengelola vendor.</Typography></Box><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><Button component={Link} to="/register" variant="contained">Daftarkan perusahaan</Button><Button component={Link} to="/login" variant="outlined">Masuk ke akun</Button></Stack></Container></section>
    </main>
    <footer className="guest-footer"><Container maxWidth="xl"><Brand /><Typography>Huntr membantu bisnis menjalankan procurement dari katalog hingga pesanan.</Typography><Stack direction="row" spacing={2}><Link to="/crowd-buy">Crowd Buy</Link><Link to="/verify">Verifikasi</Link><Link to="/register">Daftar</Link></Stack></Container></footer>
  </Box>;
}
