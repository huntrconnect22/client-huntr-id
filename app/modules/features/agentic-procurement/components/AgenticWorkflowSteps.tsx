import React, { useState } from "react";
import {
  Box,
  Paper,
  Grid,
  Stack,
  Typography,
  Button,
  Chip,
  Collapse,
  CircularProgress,
  Avatar,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import {
  Bot,
  CheckCircle2,
  AlertCircle,
  Globe,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Tag,
} from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import { type StepStatus } from "../types";

interface BraveSource {
  title: string;
  link: string;
  price?: number;
  snippet?: string;
  thumbnail?: string | null;
}

interface BrandRec {
  brand: string;
  avg_price?: number | null;
  thumbnail?: string | null;
}

interface AgenticWorkflowStepsProps {
  workflowSteps: StepStatus[];
  isRunning: boolean;
  webSearchSources?: BraveSource[];
  brandRecommendations?: BrandRec[];
}

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function AgenticWorkflowSteps({
  workflowSteps,
  isRunning,
  webSearchSources = [],
  brandRecommendations = [],
}: AgenticWorkflowStepsProps) {
  const { t } = useLanguage();
  const [showSources, setShowSources] = useState(false);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Header */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Bot size={16} color="#ef7d00" />
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.primary" }}>
            {t("agentic.workflow.header")}
          </Typography>
        </Stack>

        {isRunning && (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "primary.main" }}>
            <CircularProgress size={12} color="inherit" />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {t("agentic.workflow.analyzing")}
            </Typography>
          </Stack>
        )}
      </Stack>

      {/* Steps Cards Grid */}
      <Grid container spacing={1.5}>
        {workflowSteps.map((step, i) => {
          const isDone = step.status === "completed";
          const isCurr = step.status === "running";
          const isFail = step.status === "failed";
          const isWebSearch = step.step === "web_search";

          return (
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={i}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.75,
                  borderRadius: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 1,
                  bgcolor: isDone
                    ? "rgba(16, 185, 129, 0.04)"
                    : isCurr
                    ? "rgba(239, 125, 0, 0.06)"
                    : isFail
                    ? "rgba(239, 68, 68, 0.06)"
                    : "action.hover",
                  borderColor: isDone
                    ? "rgba(16, 185, 129, 0.3)"
                    : isCurr
                    ? "primary.main"
                    : isFail
                    ? "error.main"
                    : "divider",
                }}
              >
                <Box>
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: isDone ? "success.main" : isCurr ? "primary.main" : "text.primary" }} noWrap>
                      {step.title}
                    </Typography>
                    {isDone ? (
                      <CheckCircle2 size={15} color="#10b981" />
                    ) : isCurr ? (
                      <CircularProgress size={13} color="primary" />
                    ) : isFail ? (
                      <AlertCircle size={15} color="#ef4444" />
                    ) : (
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "text.disabled" }} />
                    )}
                  </Stack>

                  {step.summary && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.4,
                      }}
                    >
                      {step.summary}
                    </Typography>
                  )}
                </Box>

                {isWebSearch && isDone && webSearchSources.length > 0 && (
                  <Button
                    size="small"
                    variant="text"
                    color="primary"
                    onClick={() => setShowSources((v) => !v)}
                    endIcon={showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    sx={{ textTransform: "none", fontSize: 10, p: 0, minWidth: 0, justifyContent: "flex-start", mt: 0.5 }}
                  >
                    {showSources ? "Tutup Sumber" : `${webSearchSources.length} Sumber Web`}
                  </Button>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Expandable Web Search Sources & Brand Recommendations */}
      <Collapse in={showSources}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2.5,
            bgcolor: "action.hover",
            mt: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Brand Recommendations */}
          {brandRecommendations.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 1 }}>
                Rekomendasi Merk Pasar
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75 }}>
                {brandRecommendations.map((b, idx) => (
                  <Chip
                    key={idx}
                    size="small"
                    icon={<Tag size={11} />}
                    label={b.avg_price ? `${b.brand} (~${formatRp(b.avg_price)})` : b.brand}
                    variant="outlined"
                    sx={{ fontSize: 11, borderRadius: 1.5 }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Sources List */}
          {webSearchSources.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 1 }}>
                Sumber Web Brave Search ({webSearchSources.length})
              </Typography>
              <Grid container spacing={1.5}>
                {webSearchSources.slice(0, 8).map((src, idx) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }} noWrap>
                          {src.title || "Referensi Listing"}
                        </Typography>
                        {src.price && src.price > 0 ? (
                          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
                            {formatRp(src.price)}
                          </Typography>
                        ) : null}
                      </Box>
                      <MuiLink
                        href={src.link}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
                      >
                        <ExternalLink size={14} />
                      </MuiLink>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>
      </Collapse>
    </Paper>
  );
}
