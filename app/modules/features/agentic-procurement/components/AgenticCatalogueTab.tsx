import React from "react";
import { Link, useParams } from "react-router";
import {
  Box,
  Paper,
  Grid,
  Stack,
  Typography,
  Chip,
  Card,
  CardActionArea,
  Avatar,
} from "@mui/material";
import { Tag, Package, ExternalLink } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";

interface AgenticCatalogueTabProps {
  catalogues: any[];
}

const formatRupiah = (val: number) =>
  val > 0 ? `Rp ${Number(val).toLocaleString("id-ID")}` : "—";

export default function AgenticCatalogueTab({ catalogues }: AgenticCatalogueTabProps) {
  const { t } = useLanguage();
  const { companySlug } = useParams();
  const productDetailPath = (catalogueId: string) =>
    `${companySlug ? `/${companySlug}` : ""}/marketplace/${catalogueId}`;

  if (!catalogues || catalogues.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 6,
          textAlign: "center",
          borderRadius: 3,
          bgcolor: "background.paper",
          color: "text.secondary",
        }}
      >
        <Package size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t("agentic.catalogue.empty")}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          {t("agentic.catalogue.emptyHint")}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        dangerouslySetInnerHTML={{
          __html: t("agentic.catalogue.sortingHint", { count: catalogues.length }),
        }}
      />

      <Grid container spacing={2}>
        {catalogues.map((cat: any, idx: number) => {
          const score = Number(cat.ai_score ?? 85);
          const price = Number(cat.estimated_price ?? 0);

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={cat.id || idx}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2.5,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: 2,
                  },
                }}
              >
                <CardActionArea
                  component={Link}
                  to={productDetailPath(cat.id)}
                  sx={{
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                      <Chip
                        size="small"
                        label={`#${idx + 1}`}
                        sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                      />
                      <Chip
                        size="small"
                        label={`Match ${score}%`}
                        color={score >= 85 ? "success" : score >= 70 ? "warning" : "error"}
                        variant="outlined"
                        sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                      />
                    </Stack>

                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1.3 }}>
                      {cat.name}
                    </Typography>

                    {cat.brand && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        Brand: <strong>{cat.brand}</strong>
                      </Typography>
                    )}

                    {cat.category && (
                      <Chip
                        size="small"
                        icon={<Tag size={11} />}
                        label={cat.category}
                        sx={{ height: 20, fontSize: 10, borderRadius: 1 }}
                      />
                    )}
                  </Box>

                  <Box sx={{ width: "100%", pt: 2, mt: 1, borderTop: 1, borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      Estimasi Harga
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main" }}>
                      {formatRupiah(price)}
                    </Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
