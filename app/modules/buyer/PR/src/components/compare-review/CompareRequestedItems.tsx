import React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import { Package, History, Target, HelpCircle } from "lucide-react";
import { getAssetUrl } from "~/lib/assets";

interface CompareRequestedItemsProps {
  items: any[];
}

export const CompareRequestedItems: React.FC<CompareRequestedItemsProps> = ({ items = [] }) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 4,
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.75rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: "var(--ui-text-muted)",
          }}
        >
          Requested Items ({items.length})
        </Typography>
        <Typography variant="caption" sx={{ color: "var(--ui-text-muted)", fontSize: "0.75rem" }}>
          Termasuk data Last Purchase Price (Riwayat Terakhir / Target PR)
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {items.map((item: any, index: number) => {
          const catalogue = item.catalogue;
          const uom = catalogue?.uom || item.uom || "pcs";
          const lastPrice = Number(item.last_price ?? (item.estimated_price ?? 0));
          const lastPriceSource = item.last_price_source || (item.last_price ? "historical" : item.estimated_price ? "target_price" : "none");

          return (
            <Paper
              key={item.id || index}
              variant="outlined"
              sx={{
                p: 2,
                background: "var(--ui-bg-input)",
                borderRadius: 3,
                border: "1px solid var(--ui-border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 260 }}>
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    borderRadius: 2.5,
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: catalogue?.image_path ? "transparent" : "var(--ui-bg-card)",
                    border: "1px solid var(--ui-border)",
                  }}
                >
                  {catalogue?.image_path ? (
                    <img
                      src={getAssetUrl(catalogue.image_url || catalogue.image_path)}
                      alt={catalogue?.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                      }}
                    />
                  ) : (
                    <Package size={22} color="var(--ui-text-muted)" style={{ opacity: 0.5 }} />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {catalogue?.category && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.68rem",
                        color: "#ef7d00",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        display: "block",
                      }}
                    >
                      {catalogue.category}
                    </Typography>
                  )}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 800,
                      color: "var(--ui-text-primary)",
                      lineHeight: 1.3,
                    }}
                  >
                    {catalogue?.name || item.item_name || item.name || "Item"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--ui-text-muted)", display: "block" }}>
                    Qty: <strong>{item.qty}</strong> {uom}
                    {item.sku ? ` • SKU: ${item.sku}` : ""}
                  </Typography>
                  {(catalogue?.specifications || item.specifications || item.service_scope) && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "var(--ui-text-muted)",
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontSize: "0.72rem",
                        mt: 0.25,
                      }}
                    >
                      {catalogue?.specifications || item.specifications || item.service_scope}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Price Columns: Last Price & Target Price */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                {/* Last Price Column */}
                <Box sx={{ textAlign: "right", minWidth: 120 }}>
                  <Typography variant="caption" sx={{ color: "var(--ui-text-muted)", fontSize: "0.7rem", fontWeight: 700, display: "block" }}>
                    Last Purchase Price
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 900,
                      color: lastPrice === 0 ? "var(--ui-text-muted)" : "var(--ui-text-primary)",
                      fontFamily: "monospace",
                    }}
                  >
                    Rp {lastPrice.toLocaleString("id-ID")}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.25 }}>
                    {lastPriceSource === "historical" ? (
                      <Tooltip title={`Berdasarkan riwayat pembelian terakhir ${item.last_price_date ? `(${item.last_price_date})` : ""}`} arrow>
                        <Chip
                          icon={<History size={10} />}
                          label="Historical PO"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            bgcolor: "rgba(34, 197, 94, 0.12)",
                            color: "#166534",
                          }}
                        />
                      </Tooltip>
                    ) : lastPriceSource === "target_price" ? (
                      <Tooltip title="Belum pernah beli, diambil dari Target Price PR" arrow>
                        <Chip
                          icon={<Target size={10} />}
                          label="Target PR"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            bgcolor: "rgba(239, 125, 0, 0.12)",
                            color: "#c2410c",
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Tidak ada data riwayat harga atau target PR" arrow>
                        <Chip
                          icon={<HelpCircle size={10} />}
                          label="Belum Ada (0)"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            bgcolor: "var(--ui-border)",
                            color: "var(--ui-text-muted)",
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* PR Target Price Column */}
                <Box sx={{ textAlign: "right", minWidth: 110, borderLeft: "1px dashed var(--ui-border)", pl: 2 }}>
                  <Typography variant="caption" sx={{ color: "var(--ui-text-muted)", fontSize: "0.7rem", fontWeight: 700, display: "block" }}>
                    Target Price (PR)
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 800,
                      color: "#ef7d00",
                      fontFamily: "monospace",
                    }}
                  >
                    Rp {Number(item.estimated_price || 0).toLocaleString("id-ID")}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "var(--ui-text-muted)" }}>
                    per {uom}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Paper>
  );
};
