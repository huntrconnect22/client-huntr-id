import React, { useState } from "react";
import {
  Box,
  Paper,
  Grid,
  Stack,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Avatar,
  Link as MuiLink,
} from "@mui/material";
import {
  Sparkles,
  CheckCircle2,
  Check,
  Award,
  BarChart2,
  Radar as RadarIcon,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Tag,
  MousePointerClick,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { useLanguage } from "../../../context/LanguageContext";

interface AgenticComparisonTabProps {
  comparison: any;
  formatRupiah: (num: number) => string;
  onSelectWinner?: (item: any) => void;
  selectedWinnerId?: string | null;
}

const CHART_COLORS = [
  "#ef7d00",
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f43f5e",
  "#eab308",
];

type ViewMode = "cards" | "radar" | "bar";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: "background.paper",
          boxShadow: 3,
          fontSize: 12,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800, display: "block", mb: 0.5 }}>
          {label}
        </Typography>
        {payload.map((p: any, i: number) => (
          <Typography key={i} variant="caption" sx={{ color: p.color, fontWeight: 700, display: "block" }}>
            {p.name}:{" "}
            {typeof p.value === "number" && p.value > 10000
              ? `Rp ${p.value.toLocaleString("id-ID")}`
              : p.value}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

function ProductThumbnail({ src, alt, fallback }: { src?: string | null; alt: string; fallback?: string }) {
  const [failed, setFailed] = useState(false);
  const altText = alt || fallback || "";
  if (!src || failed) {
    return (
      <Box
        sx={{
          width: "100%",
          height: 128,
          borderRadius: 2,
          bgcolor: "action.hover",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: 1,
          borderColor: "divider",
        }}
      >
        <ImageIcon size={28} style={{ opacity: 0.3 }} />
      </Box>
    );
  }
  return (
    <Box
      component="img"
      src={src}
      alt={altText}
      onError={() => setFailed(true)}
      sx={{
        width: "100%",
        height: 128,
        objectFit: "contain",
        borderRadius: 2,
        bgcolor: "action.hover",
        border: 1,
        borderColor: "divider",
      }}
    />
  );
}

export default function AgenticComparisonTab({
  comparison,
  formatRupiah,
  onSelectWinner,
  selectedWinnerId,
}: AgenticComparisonTabProps) {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});
  const [localSelected, setLocalSelected] = useState<string | null>(selectedWinnerId ?? null);

  function handleSelect(item: any) {
    const id = String(item.catalogue_id ?? item.id ?? item.product_name);
    setLocalSelected(id);
    onSelectWinner?.(item);
  }

  if (!comparison) return null;

  const winnerId = comparison.winner_id ?? null;
  const matrix: any[] = comparison.comparison_matrix || [];
  const isWebListingOnly = comparison.source === "brave_web_listings";

  const radarDimKeys = [
    "chartDimensions.score",
    "chartDimensions.pros",
    "chartDimensions.consInv",
  ] as const;
  const radarDimensions = radarDimKeys.map((k) => t(`agentic.comparison.${k}`));
  const productFallback = t("agentic.comparison.productFallback");
  const radarData = radarDimensions.map((dim, dimIdx) => {
    const entry: any = { subject: dim };
    matrix.forEach((item) => {
      const name = item.product_name?.substring(0, 18) ?? `${productFallback} ${item.catalogue_id}`;
      if (radarDimKeys[dimIdx] === "chartDimensions.score") entry[name] = item.score ?? 75;
      if (radarDimKeys[dimIdx] === "chartDimensions.pros") entry[name] = Math.min((item.pros?.length ?? 0) * 20, 100);
      if (radarDimKeys[dimIdx] === "chartDimensions.consInv") entry[name] = Math.max(100 - (item.cons?.length ?? 0) * 25, 0);
    });
    return entry;
  });

  const barWebPriceKey = t("agentic.comparison.chartData.webPrice");
  const barData = matrix.map((item) => ({
    name: item.product_name?.substring(0, 18) ?? `${productFallback} ${item.catalogue_id}`,
    [barWebPriceKey]: Math.round(item.web_price_avg || 0),
    Score: item.score ?? 75,
    isWinner: winnerId !== null && String(item.catalogue_id) === String(winnerId),
  }));

  const productNames = matrix.map(
    (item) => item.product_name?.substring(0, 18) ?? `${productFallback} ${item.catalogue_id}`
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* ── AI Recommendation Banner ── */}
      {comparison.executive_summary && (
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            borderColor: "rgba(239, 125, 0, 0.3)",
            bgcolor: "rgba(239, 125, 0, 0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {isWebListingOnly ? <Globe size={16} color="#ef7d00" /> : <Sparkles size={16} color="#ef7d00" />}
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "primary.main" }}>
              {isWebListingOnly ? t("agentic.comparison.webListings") : t("agentic.comparison.aiAnalysis")}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
            {comparison.executive_summary}
          </Typography>
          {comparison.winner_reason && (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(16, 185, 129, 0.08)",
                borderColor: "rgba(16, 185, 129, 0.25)",
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
              }}
            >
              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
              <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
                <Typography component="span" variant="caption" sx={{ fontWeight: 800, color: "success.main" }}>
                  {t("agentic.comparison.topRecommendation")}{" "}
                </Typography>
                {comparison.winner_reason}
              </Typography>
            </Paper>
          )}
        </Paper>
      )}

      {/* ── View Mode Toggle ── */}
      {matrix.length > 0 && !isWebListingOnly && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary" }}>
            {t("agentic.comparison.viewModeLabel")}:
          </Typography>
          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: 12,
                px: 2,
                borderRadius: 2,
              },
            }}
          >
            <ToggleButton value="cards">
              <Award size={13} style={{ marginRight: 6 }} /> {t("agentic.comparison.viewCards")}
            </ToggleButton>
            <ToggleButton value="radar">
              <RadarIcon size={13} style={{ marginRight: 6 }} /> {t("agentic.comparison.viewRadar")}
            </ToggleButton>
            <ToggleButton value="bar">
              <BarChart2 size={13} style={{ marginRight: 6 }} /> {t("agentic.comparison.viewBar")}
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      )}

      {/* ── CARDS VIEW ── */}
      {viewMode === "cards" && (
        <>
          {matrix.length > 0 ? (
            <Grid container spacing={2}>
              {matrix.map((item: any, idx: number) => {
                const isWinner =
                  winnerId !== null && String(item.catalogue_id) === String(winnerId);
                const listingPrice = Number(item.web_listing_price || 0);
                const marketPrice = Number(item.web_price_avg || 0);
                const hasBravePrice = listingPrice > 0 || marketPrice > 0;
                const showSrc = expandedSources[idx] ?? false;
                const webSources: any[] = item.web_sources ?? [];
                const localKey = String(item.catalogue_id ?? item.id ?? item.product_name);
                const isSelected = localKey === localSelected;

                return (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={idx}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        borderWidth: isWinner || isSelected ? 2 : 1,
                        borderColor: isWinner
                          ? "success.main"
                          : isSelected
                          ? "primary.main"
                          : "divider",
                        boxShadow: isWinner
                          ? "0 4px 16px rgba(16, 185, 129, 0.15)"
                          : isSelected
                          ? "0 4px 16px rgba(239, 125, 0, 0.15)"
                          : "none",
                      }}
                    >
                      {/* Top Badges */}
                      <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 1, display: "flex", gap: 0.5 }}>
                        {isWinner && (
                          <Chip
                            size="small"
                            icon={<Award size={12} color="#ffffff" />}
                            label={t("agentic.comparison.recommendedBadge")}
                            color="success"
                            sx={{ fontWeight: 800, fontSize: 10, height: 22 }}
                          />
                        )}
                        {isSelected && (
                          <Chip
                            size="small"
                            icon={<MousePointerClick size={12} color="#ffffff" />}
                            label={t("agentic.comparison.selectedBadge")}
                            color="primary"
                            sx={{ fontWeight: 800, fontSize: 10, height: 22 }}
                          />
                        )}
                      </Box>

                      {/* Thumbnail */}
                      <Box sx={{ p: 2, pb: 0 }}>
                        <ProductThumbnail src={item.thumbnail} alt={item.product_name ?? productFallback} fallback={productFallback} />
                      </Box>

                      <CardContent sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                            {item.product_name}
                          </Typography>
                          {item.vendor_name && (
                            <Typography variant="caption" color="text.secondary">
                              {item.vendor_name}
                            </Typography>
                          )}
                        </Box>

                        {/* Score Bar */}
                        {!isWebListingOnly && (
                          <Box>
                            <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">Skor Kecocokan:</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: isWinner ? "success.main" : "primary.main" }}>
                                {item.score || 85}/100
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={item.score || 85}
                              color={isWinner ? "success" : "primary"}
                              sx={{ height: 6, borderRadius: 1 }}
                            />
                          </Box>
                        )}

                        {/* Price Reference */}
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: hasBravePrice ? "rgba(59, 130, 246, 0.05)" : "action.hover",
                            borderColor: hasBravePrice ? "rgba(59, 130, 246, 0.25)" : "divider",
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: 10, color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}>
                            <Globe size={11} /> {t("agentic.comparison.braveMarketPrice")}
                          </Typography>
                          {hasBravePrice ? (
                            <>
                              <Typography variant="subtitle1" sx={{ fontWeight: 900, fontFamily: "monospace", color: "info.main" }}>
                                {formatRupiah(Math.round(listingPrice || marketPrice))}
                              </Typography>
                              {!listingPrice && (item.web_price_min || item.web_price_max) && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                  Rentang: {formatRupiah(Math.round(item.web_price_min ?? item.web_price_avg))} – {formatRupiah(Math.round(item.web_price_max ?? item.web_price_avg))}
                                </Typography>
                              )}
                            </>
                          ) : (
                            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                              {t("agentic.comparison.noPriceFound")}
                            </Typography>
                          )}
                        </Paper>

                        {/* Key Specs */}
                        {item.key_specs && (
                          <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5, bgcolor: "action.hover" }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: 9, color: "text.secondary", display: "block" }}>
                              {t("agentic.comparison.mainSpecs")}
                            </Typography>
                            <Typography variant="caption" sx={{ lineHeight: 1.4 }}>
                              {item.key_specs}
                            </Typography>
                          </Paper>
                        )}

                        {/* Pros */}
                        {item.pros?.length > 0 && (
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main", display: "block", mb: 0.5 }}>
                              {t("agentic.comparison.prosLabel")}
                            </Typography>
                            <Stack spacing={0.5}>
                              {item.pros.map((pro: string, pIdx: number) => (
                                <Stack direction="row" spacing={0.75} key={pIdx} sx={{ alignItems: "flex-start" }}>
                                  <Check size={13} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                                  <Typography variant="caption" color="text.secondary">{pro}</Typography>
                                </Stack>
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {/* Cons */}
                        {item.cons?.length > 0 && (
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "warning.main", display: "block", mb: 0.5 }}>
                              {t("agentic.comparison.consLabel")}
                            </Typography>
                            <Stack spacing={0.5}>
                              {item.cons.map((con: string, cIdx: number) => (
                                <Stack direction="row" spacing={0.75} key={cIdx} sx={{ alignItems: "flex-start" }}>
                                  <Typography variant="caption" color="warning.main">•</Typography>
                                  <Typography variant="caption" color="text.secondary">{con}</Typography>
                                </Stack>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </CardContent>

                      <Divider />

                      <CardActions sx={{ p: 1.5, px: 2, display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                          {isWebListingOnly ? t("agentic.comparison.unverifiedWebListing") : (item.value_rating ?? t("agentic.comparison.valueRfq"))}
                        </Typography>

                        {isSelected ? (
                          <Chip
                            size="small"
                            icon={<CheckCircle2 size={12} color="#ffffff" />}
                            label={t("agentic.comparison.selected")}
                            color="primary"
                            sx={{ fontWeight: 700, fontSize: 10 }}
                          />
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleSelect(item)}
                            startIcon={<MousePointerClick size={13} />}
                            sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, borderRadius: 1.5 }}
                          >
                            {t("agentic.comparison.pickButton")}
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderRadius: 3, color: "text.secondary" }}>
              <Typography variant="body2">{t("agentic.comparison.emptyCompare")}</Typography>
            </Paper>
          )}
        </>
      )}

      {/* ── RADAR VIEW ── */}
      {viewMode === "radar" && matrix.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "background.paper" }}>
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary", display: "block", mb: 2 }}>
            {t("agentic.comparison.radarTitle")}
          </Typography>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 11 }} />
              {productNames.map((name, i) => (
                <Radar
                  key={name}
                  name={name}
                  dataKey={name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* ── BAR VIEW ── */}
      {viewMode === "bar" && matrix.length > 0 && (
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "background.paper" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary", display: "block", mb: 0.5 }}>
              {t("agentic.comparison.barPriceTitle")}
            </Typography>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={barWebPriceKey} radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={`cell-price-${i}`} fill={entry.isWinner ? "#10b981" : CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "background.paper" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary", display: "block", mb: 0.5 }}>
              {t("agentic.comparison.barScoreTitle")}
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Score" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={`cell-score-${i}`} fill={entry.isWinner ? "#10b981" : CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
