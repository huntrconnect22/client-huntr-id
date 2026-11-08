import React from "react";
import { useNavigate } from "react-router";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import {
  ShoppingCart,
  Plus,
  Minus,
  Package,
  CheckCircle2,
  ArrowRight,
  Tag,
  Ruler,
  X,
  Sparkles,
  Trash2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Swal from "sweetalert2";
import { getAssetUrl } from "../lib/assets";
import {
  type CartItem,
  updateCartQty,
  setCartItemQty,
  removeCartItem,
  clearCart,
  getCartItemCount,
} from "../lib/cart";
import { useLanguage } from "../context/LanguageContext";

interface CartSidebarProps {
  open?: boolean;
  onClose?: () => void;
  cart: CartItem[];
  onCartChange: (cart: CartItem[]) => void;
  companyPrefix: string;
  /** Legacy prop preserved for backward compatibility */
  embedded?: boolean;
}

export default function CartSidebar({
  open = true,
  onClose,
  cart,
  onCartChange,
  companyPrefix,
}: CartSidebarProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const totalItems = getCartItemCount(cart);
  const skuCount = cart.length;

  const handleQty = (id: string, delta: number) => {
    onCartChange(updateCartQty(id, delta));
  };

  const handleSetQty = (id: string, qty: number) => {
    onCartChange(setCartItemQty(id, Math.max(1, qty)));
  };

  const handleRemove = async (item: CartItem) => {
    const result = await Swal.fire({
      title: t("marketplace.cartSidebar.removeConfirmTitle"),
      text: item.name,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("marketplace.cartSidebar.removeBtn"),
      cancelButtonText: t("marketplace.cartSidebar.cancelBtn"),
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
    });
    if (result.isConfirmed) onCartChange(removeCartItem(item.id));
  };

  const handleClear = async () => {
    if (cart.length === 0) return;
    const result = await Swal.fire({
      title: t("marketplace.cartSidebar.clearConfirmTitle"),
      text: t("marketplace.cartSidebar.clearConfirmText", { count: skuCount }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("marketplace.cartSidebar.clearConfirmBtn"),
      cancelButtonText: t("marketplace.cartSidebar.cancelBtn"),
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
    });
    if (result.isConfirmed) {
      clearCart();
      onCartChange([]);
    }
  };

  const handleCheckout = () => {
    onClose?.();
    navigate(`${companyPrefix}/checkout`);
  };

  const handleViewFullCart = () => {
    onClose?.();
    navigate(`${companyPrefix}/cart`);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(3px)",
          },
        },
        paper: {
          sx: {
            width: { xs: "100%", sm: 400 },
            maxWidth: "100vw",
            bgcolor: "background.paper",
            backgroundImage: "none",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-12px 0 32px rgba(0, 0, 0, 0.15)",
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 36,
              height: 36,
              bgcolor: "#ef7d00",
              color: "#fff",
              borderRadius: 2,
            }}
          >
            <ShoppingCart size={18} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t("marketplace.cartSidebar.title") || "Keranjang Belanja"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalItems > 0
                ? t("marketplace.cartSidebar.counts", { skus: skuCount, units: totalItems })
                : "0 item"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {cart.length > 0 && (
            <Button
              size="small"
              color="error"
              onClick={handleClear}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                px: 1,
                minWidth: 0,
              }}
            >
              {t("marketplace.cartSidebar.clear") || "Hapus Semua"}
            </Button>
          )}
          {onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              aria-label={t("marketplace.cartSidebar.close") || "Close"}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "text.primary", bgcolor: "action.hover" },
              }}
            >
              <X size={18} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Body */}
      {cart.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            textAlign: "center",
          }}
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: "action.hover",
              color: "text.disabled",
              mb: 2,
            }}
          >
            <Package size={32} />
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t("marketplace.cartSidebar.emptyTitle") || "Keranjang Masih Kosong"}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, mb: 3, maxWidth: 280 }}
          >
            {t("marketplace.cartSidebar.emptyDesc") ||
              "Telusuri katalog marketplace dan tambahkan produk yang dibutuhkan."}
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              onClose?.();
              navigate(`${companyPrefix}/marketplace`);
            }}
            endIcon={<ArrowRight size={16} />}
            sx={{
              bgcolor: "#ef7d00",
              "&:hover": { bgcolor: "#d66f00" },
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
            }}
          >
            Jelajahi Marketplace
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {cart.map((item) => (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                borderColor: "divider",
                bgcolor: "background.paper",
                position: "relative",
                transition: "border-color 0.15s ease",
                "&:hover": { borderColor: "primary.light" },
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                {/* Thumbnail */}
                <Avatar
                  variant="rounded"
                  src={
                    item.image_url || item.image_path
                      ? getAssetUrl((item.image_url || item.image_path) as string)
                      : undefined
                  }
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    bgcolor: "action.hover",
                    border: 1,
                    borderColor: "divider",
                    flexShrink: 0,
                  }}
                >
                  <Package size={20} />
                </Avatar>

                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0, pr: 3 }}>
                  <Typography
                    variant="body2"
                    noWrap
                    title={item.name}
                    sx={{ fontSize: "0.85rem", fontWeight: 600 }}
                  >
                    {item.name}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5, flexWrap: "wrap" }}>
                    {item.item_code && (
                      <Chip
                        size="small"
                        icon={<Tag size={10} />}
                        label={item.item_code}
                        sx={{ height: 20, fontSize: "0.68rem" }}
                      />
                    )}
                    {item.uom && (
                      <Chip
                        size="small"
                        icon={<Ruler size={10} />}
                        label={item.uom}
                        sx={{ height: 20, fontSize: "0.68rem" }}
                      />
                    )}
                  </Box>

                  {item.estimated_price && Number(item.estimated_price) > 0 ? (
                    <Typography
                      variant="caption"
                      color="#ef7d00"
                      sx={{ display: "block", mt: 0.5, fontWeight: 700 }}
                    >
                      Rp {Number(item.estimated_price).toLocaleString("id-ID")}{" "}
                      <span style={{ fontWeight: 400, color: "var(--ui-text-muted, #94a3b8)" }}>
                        / {item.uom || "unit"}
                      </span>
                    </Typography>
                  ) : null}
                </Box>

                {/* Delete button */}
                <Tooltip title="Hapus">
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(item)}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: "text.disabled",
                      "&:hover": { color: "error.main", bgcolor: "error.lighter" },
                    }}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Stepper Row */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 1.5,
                  pt: 1,
                  borderTop: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Kuantitas
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1.5,
                    overflow: "hidden",
                    bgcolor: "action.hover",
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleQty(item.id, -1)}
                    disabled={item.qty <= 1}
                    sx={{ p: 0.5, borderRadius: 0, width: 28, height: 28 }}
                  >
                    <Minus size={13} />
                  </IconButton>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.qty}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      handleSetQty(item.id, val === "" ? 1 : Number(val));
                    }}
                    style={{
                      width: 44,
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "inherit",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleQty(item.id, 1)}
                    sx={{ p: 0.5, borderRadius: 0, width: 28, height: 28 }}
                  >
                    <Plus size={13} />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Footer */}
      {cart.length > 0 && (
        <Box
          sx={{
            p: 2.5,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {t("marketplace.cartSidebar.totalUnits") || "Total Unit"}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {totalItems} Unit
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {t("marketplace.cartSidebar.skus") || "Total SKU"}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {skuCount} Produk
            </Typography>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 1.25,
              borderRadius: 2,
              borderColor: "divider",
              bgcolor: "action.hover",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <AlertCircle size={14} style={{ color: "#ef7d00", flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
              {t("marketplace.cartSidebar.vendorQuoteNotice") ||
                "Harga dan spesifikasi akan dikonfirmasi melalui penawaran vendor saat pembuatan PR."}
            </Typography>
          </Paper>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleCheckout}
            startIcon={<CheckCircle2 size={18} />}
            endIcon={<ArrowRight size={18} />}
            sx={{
              bgcolor: "#ef7d00",
              "&:hover": { bgcolor: "#d66f00" },
              fontWeight: 700,
              py: 1.3,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "0.95rem",
              boxShadow: "0 4px 14px rgba(239, 125, 0, 0.35)",
            }}
          >
            {t("marketplace.cartSidebar.createPrBtn") || "Buat Purchase Request"}
          </Button>

          <Button
            variant="outlined"
            fullWidth
            size="small"
            onClick={handleViewFullCart}
            endIcon={<ExternalLink size={14} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              borderColor: "divider",
              color: "text.secondary",
              "&:hover": { borderColor: "#ef7d00", color: "#ef7d00", bgcolor: "transparent" },
            }}
          >
            Lihat Halaman Keranjang Lengkap
          </Button>

          {cart.length >= 3 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                color: "secondary.main",
                fontSize: "0.75rem",
              }}
            >
              <Sparkles size={13} />
              <Typography variant="caption" color="inherit">
                {t("marketplace.cartSidebar.aiCheckoutHint")}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Drawer>
  );
}
