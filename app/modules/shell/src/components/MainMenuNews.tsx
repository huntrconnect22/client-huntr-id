import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Landmark, LoaderCircle, RefreshCw, TrendingUp } from "lucide-react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { getMainMenuNews, type MainMenuNewsArticle, type MainMenuNewsCategory } from "~/modules/shared/api/news";

const filters: Array<{ id: MainMenuNewsCategory; label: string; Icon: typeof TrendingUp }> = [
  { id: "all", label: "Semua", Icon: TrendingUp },
  { id: "economy", label: "Ekonomi", Icon: TrendingUp },
  { id: "politics", label: "Politik", Icon: Landmark },
];

const articleTime = (publishedAt: string | null) => {
  if (!publishedAt) return "Baru saja";
  const date = new Date(publishedAt);
  return Number.isNaN(date.getTime()) ? "Baru saja" : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export function MainMenuNews({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState<MainMenuNewsCategory>("all");
  const [articles, setArticles] = useState<MainMenuNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await getMainMenuNews();
      setArticles(Array.isArray(response.articles) ? response.articles : []);
      setNotice(response.notice || "");
    } catch (requestError: any) {
      setError(requestError?.message || "Berita belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visibleArticles = useMemo(
    () => category === "all" ? articles : articles.filter((article) => article.category === category),
    [articles, category],
  );

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 2 }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 750, letterSpacing: "0.1em" }}>Huntr brief</Typography>
          <Typography component="h3" variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.025em" }}>Ekonomi & Politik</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Informasi pasar dan kebijakan yang relevan untuk keputusan bisnis.</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <ButtonBase type="button" onClick={() => void load()} disabled={loading} aria-label="Muat ulang berita" sx={{ width: 40, height: 40, border: 1, borderColor: "divider", borderRadius: 1.5, color: "text.secondary", "&:hover": { color: "primary.main", borderColor: "primary.main" } }}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </ButtonBase>
          <ButtonBase type="button" onClick={onBack} sx={{ minHeight: 40, px: 1.25, gap: 0.5, border: 1, borderColor: "divider", borderRadius: 1.5, color: "text.primary", fontSize: 13, fontWeight: 750, "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
            <ArrowRight size={17} /> Menu
          </ButtonBase>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 0.75, overflowX: "auto", pb: 1.25, mb: 0.5, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
        {filters.map(({ id, label, Icon }) => <Chip key={id} icon={<Icon size={15} />} label={label} onClick={() => setCategory(id)} color={category === id ? "primary" : "default"} variant={category === id ? "filled" : "outlined"} sx={{ flexShrink: 0, borderRadius: 1.5, fontWeight: 750 }} />)}
      </Box>

      {loading ? (
        <Box sx={{ minHeight: 260, display: "grid", placeItems: "center", color: "text.secondary" }}><LoaderCircle className="animate-spin" size={26} /></Box>
      ) : error ? (
        <NewsState title="Berita belum tersedia" description={error} />
      ) : visibleArticles.length === 0 ? (
        <NewsState title="Belum ada berita" description={notice || "Sumber berita belum mengembalikan artikel untuk kategori ini."} />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: { xs: 1.25, sm: 1.5 } }}>
          {visibleArticles.map((article) => <ArticleCard key={article.url} article={article} />)}
        </Box>
      )}
    </Box>
  );
}

function ArticleCard({ article }: { article: MainMenuNewsArticle }) {
  return (
    <CardActionArea component="a" href={article.url} target="_blank" rel="noreferrer" sx={{ minHeight: 292, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "stretch", border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: "background.paper", color: "text.primary", "&:hover": { borderColor: "primary.main", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.1)" } }}>
      <Box sx={{ height: 126, bgcolor: article.category === "economy" ? "primary.light" : "secondary.light", backgroundImage: article.image_url ? `url(${article.image_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
          <Chip label={article.category === "economy" ? "Ekonomi" : "Politik"} size="small" color={article.category === "economy" ? "primary" : "secondary"} sx={{ height: 22, borderRadius: 1, fontSize: 11, fontWeight: 800 }} />
          <ExternalLink size={15} color="currentColor" />
        </Box>
        <Typography component="h4" variant="body2" sx={{ fontWeight: 800, lineHeight: 1.35 }}>{article.title}</Typography>
        {article.summary && <Typography variant="caption" color="text.secondary" sx={{ display: "-webkit-box", mt: 0.75, overflow: "hidden", lineHeight: 1.45, WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{article.summary}</Typography>}
        <Box sx={{ mt: "auto", pt: 1.25 }}>
          <Typography noWrap variant="caption" sx={{ display: "block", fontWeight: 750 }}>{article.source}</Typography>
          <Typography variant="caption" color="text.secondary">{articleTime(article.published_at)}</Typography>
        </Box>
      </Box>
    </CardActionArea>
  );
}

function NewsState({ title, description }: { title: string; description: string }) {
  return <Box sx={{ py: 8, textAlign: "center", border: 1, borderColor: "divider", borderStyle: "dashed", borderRadius: 1.5 }}><Typography sx={{ fontWeight: 800 }}>{title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography></Box>;
}
