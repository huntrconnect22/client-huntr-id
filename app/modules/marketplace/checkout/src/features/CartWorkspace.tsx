import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import Layout from "~/components/Layout";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Package,
  Tag,
  Ruler,
  ShoppingBag,
  AlertCircle,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  loadCart,
  removeCartItem,
  updateCartQty,
  setCartItemQty,
  clearCart,
  getCartItemCount,
  addItemToCart,
  type CartItem,
} from "~/lib/cart";
import { getAssetUrl } from "~/lib/assets";

export default function CartPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCompany, setActiveCompany] = useState<any>(null);

  const refreshCart = () => setCart(loadCart());

  const getCompanyPrefix = (comp?: any) => {
    const c = comp ?? activeCompany;
    if (!c) return "";
    const slug =
      c.slug ||
      c.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    return slug ? `/${slug}` : "";
  };

  useEffect(() => {
    // Resolve active company slug
    try {
      const stored = localStorage.getItem("active_company");
      if (stored) setActiveCompany(JSON.parse(stored));
    } catch {}

    // Auto-add item from landing page deep-link: /cart?add=<id>&name=&uom=&brand=&image=&category=
    const addId = searchParams.get("add");
    if (addId) {
      addItemToCart(
        {
          id: addId,
          name: searchParams.get("name") ?? "Product",
          uom: searchParams.get("uom") ?? undefined,
          category: searchParams.get("category") ?? undefined,
          image_url: searchParams.get("image") ?? undefined,
          estimated_price: 0,
        },
        1
      );
      setSearchParams({}, { replace: true });
    }

    refreshCart();
    const handler = () => refreshCart();
    window.addEventListener("huntr-cart-updated", handler);
    return () => window.removeEventListener("huntr-cart-updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to slug URL if on legacy /cart path
  useEffect(() => {
    if (!activeCompany) return;
    const slug = getCompanyPrefix(activeCompany);
    if (slug && !window.location.pathname.startsWith(slug)) {
      navigate(`${slug}/cart`, { replace: true });
    }
  }, [activeCompany, navigate]);

  const handleUpdateQty = (id: string, delta: number) => {
    updateCartQty(id, delta);
    refreshCart();
  };

  const handleSetQty = (id: string, qty: number) => {
    setCartItemQty(id, Math.max(1, qty));
    refreshCart();
  };

  const handleRemove = async (item: CartItem) => {
    const result = await Swal.fire({
      title: "Hapus item ini dari keranjang?",
      text: item.name,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
    });
    if (result.isConfirmed) {
      removeCartItem(item.id);
      refreshCart();
    }
  };

  const handleClear = async () => {
    if (cart.length === 0) return;
    const result = await Swal.fire({
      title: "Kosongkan seluruh keranjang?",
      text: `Semua ${cart.length} item akan dihapus dari keranjang.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Kosongkan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
    });
    if (result.isConfirmed) {
      clearCart();
      refreshCart();
    }
  };

  const totalItems = getCartItemCount(cart);
  const prefix = getCompanyPrefix();

  const totalEstimatedPrice = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item.estimated_price || item.price || 0);
      return sum + (price * Number(item.qty || 1));
    }, 0);
  }, [cart]);

  return (
    <Layout title="Cart" subtitle="Review items before submitting a Purchase Request.">
      <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
        {/* Header Bar */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 44,
                height: 44,
                bgcolor: "#ef7d00",
                color: "#fff",
                borderRadius: 2.5,
                boxShadow: "0 2px 8px rgba(239, 125, 0, 0.3)",
              }}
            >
              <ShoppingCart size={22} />
            </Avatar>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }} color="text.primary">
                  Keranjang Pengadaan
                </Typography>
                {cart.length > 0 && (
                  <Chip
                    label={`${totalItems} unit • ${cart.length} SKU`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: "rgba(239, 125, 0, 0.12)",
                      color: "#ef7d00",
                      borderRadius: 1.5,
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Periksa daftar barang & kebutuhan sebelum diajukan ke dalam Purchase Request (PR).
              </Typography>
            </Box>
          </Box>

          {cart.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleClear}
              startIcon={<Trash2 size={16} />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                alignSelf: { xs: "flex-end", sm: "center" },
              }}
            >
              Kosongkan Keranjang
            </Button>
          )}
        </Box>

        {/* Empty State */}
        {cart.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              py: { xs: 6, sm: 10 },
              px: 3,
              borderRadius: 3.5,
              borderColor: "divider",
              bgcolor: "background.paper",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "action.hover",
                color: "text.disabled",
                mb: 2.5,
              }}
            >
              <ShoppingBag size={40} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.primary">
              Keranjang Pengadaan Masih Kosong
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, mb: 3.5, maxWidth: 440, lineHeight: 1.6 }}
            >
              Belum ada produk yang dimasukkan ke dalam keranjang. Silakan jelajahi katalog marketplace
              untuk memilih barang dan jasa yang dibutuhkan perusahaan Anda.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(`${prefix}/marketplace`)}
              startIcon={<Package size={18} />}
              endIcon={<ArrowRight size={18} />}
              sx={{
                bgcolor: "#ef7d00",
                "&:hover": { bgcolor: "#d66f00" },
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 700,
                px: 3.5,
                py: 1.3,
                boxShadow: "0 4px 14px rgba(239, 125, 0, 0.35)",
              }}
            >
              Jelajahi Katalog Marketplace
            </Button>
          </Paper>
        ) : (
          /* 2-Column Responsive Layout */
          <Grid container spacing={3}>
            {/* Left Column: Items Table / List */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 3.5,
                  overflow: "hidden",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                {/* List Header */}
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "action.hover",
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="text.primary">
                    Daftar Barang & Kebutuhan
                  </Typography>
                  <Chip
                    label={`${cart.length} Produk`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                  />
                </Box>

                {/* Items Container */}
                <Box sx={{ divideY: "1px solid", borderColor: "divider" }}>
                  {cart.map((item) => {
                    const price = Number(item.estimated_price || item.price || 0);
                    const subtotal = price * Number(item.qty || 1);

                    return (
                      <Box
                        key={item.id}
                        sx={{
                          p: { xs: 2, sm: 2.5 },
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: { xs: "flex-start", sm: "center" },
                          gap: 2,
                          transition: "background-color 0.15s ease",
                          "&:hover": { bgcolor: "action.hover" },
                          borderBottom: 1,
                          borderColor: "divider",
                        }}
                      >
                        {/* Thumbnail */}
                        <Avatar
                          variant="rounded"
                          src={
                            item.image_url || item.image_path
                              ? getAssetUrl((item.image_url || item.image_path) as string)
                              : undefined
                          }
                          sx={{
                            width: { xs: 52, sm: 64 },
                            height: { xs: 52, sm: 64 },
                            borderRadius: 2,
                            bgcolor: "action.hover",
                            border: 1,
                            borderColor: "divider",
                            flexShrink: 0,
                          }}
                        >
                          <Package size={28} />
                        </Avatar>

                        {/* Info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="text.primary">
                            {item.name}
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 0.75,
                              flexWrap: "wrap",
                            }}
                          >
                            {item.item_code && (
                              <Chip
                                size="small"
                                icon={<Tag size={12} />}
                                label={item.item_code}
                                variant="outlined"
                                sx={{ height: 22, fontSize: "0.7rem", fontWeight: 500 }}
                              />
                            )}
                            {item.uom && (
                              <Chip
                                size="small"
                                icon={<Ruler size={12} />}
                                label={item.uom}
                                variant="outlined"
                                sx={{ height: 22, fontSize: "0.7rem", fontWeight: 500 }}
                              />
                            )}
                            {item.category && (
                              <Chip
                                size="small"
                                label={item.category}
                                sx={{ height: 22, fontSize: "0.7rem", bgcolor: "action.selected" }}
                              />
                            )}
                          </Box>

                          {price > 0 ? (
                            <Typography
                              variant="caption"
                              color="#ef7d00"
                              sx={{ display: "block", mt: 0.75, fontWeight: 600 }}
                            >
                              Rp {price.toLocaleString("id-ID")}{" "}
                              <span style={{ fontWeight: 400, color: "var(--ui-text-muted, #94a3b8)" }}>
                                / {item.uom || "unit"}
                              </span>
                            </Typography>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 0.75, fontStyle: "italic" }}
                            >
                              Harga tergantung penawaran vendor saat RFQ
                            </Typography>
                          )}
                        </Box>

                        {/* Controls (Qty Stepper & Subtotal) */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: { xs: "space-between", sm: "flex-end" },
                            width: { xs: "100%", sm: "auto" },
                            gap: { xs: 2, sm: 3 },
                            flexShrink: 0,
                          }}
                        >
                          {/* Stepper */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 2,
                              overflow: "hidden",
                              bgcolor: "action.hover",
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQty(item.id, -1)}
                              disabled={item.qty <= 1}
                              sx={{ p: 0.75, borderRadius: 0, width: 32, height: 32 }}
                            >
                              <Minus size={14} />
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
                                width: 48,
                                textAlign: "center",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                color: "inherit",
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQty(item.id, 1)}
                              sx={{ p: 0.75, borderRadius: 0, width: 32, height: 32 }}
                            >
                              <Plus size={14} />
                            </IconButton>
                          </Box>

                          {/* Subtotal column if price > 0 */}
                          {price > 0 && (
                            <Box sx={{ minWidth: 110, textAlign: "right" }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                Subtotal
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }} color="text.primary">
                                Rp {subtotal.toLocaleString("id-ID")}
                              </Typography>
                            </Box>
                          )}

                          {/* Remove button */}
                          <Tooltip title="Hapus dari keranjang">
                            <IconButton
                              size="small"
                              onClick={() => handleRemove(item)}
                              sx={{
                                color: "text.disabled",
                                "&:hover": { color: "error.main", bgcolor: "error.lighter" },
                              }}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                {/* List Footer */}
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "action.hover",
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => navigate(`${prefix}/marketplace`)}
                    startIcon={<ArrowLeft size={16} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: "text.secondary",
                      "&:hover": { color: "text.primary" },
                    }}
                  >
                    Lanjut Belanja di Marketplace
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Total {totalItems} unit produk
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Right Column: Sticky Summary */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3.5,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  position: { lg: "sticky" },
                  top: { lg: 88 },
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800 }} color="text.primary">
                  Ringkasan Permintaan
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Kuantitas
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {totalItems} Unit
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Jumlah SKU
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {cart.length} Produk
                    </Typography>
                  </Box>

                  {totalEstimatedPrice > 0 && (
                    <>
                      <Divider sx={{ my: 0.5 }} />
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="text.primary">
                          Estimasi Biaya
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }} color="#ef7d00">
                          Rp {totalEstimatedPrice.toLocaleString("id-ID")}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Stack>

                <Alert
                  severity="info"
                  variant="outlined"
                  icon={<AlertCircle size={18} style={{ color: "#ef7d00" }} />}
                  sx={{
                    borderRadius: 2.5,
                    mb: 3,
                    fontSize: "0.8rem",
                    borderColor: "divider",
                    bgcolor: "action.hover",
                    "& .MuiAlert-message": { color: "text.secondary", lineHeight: 1.5 },
                  }}
                >
                  Seluruh barang di keranjang akan dimasukkan ke dalam draft Purchase Request (PR). Anda dapat
                  menentukan rincian spesifikasi, target harga, dan TOR pada tahap berikutnya.
                </Alert>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate(`${prefix}/checkout`)}
                  startIcon={<CheckCircle2 size={18} />}
                  endIcon={<ArrowRight size={18} />}
                  sx={{
                    bgcolor: "#ef7d00",
                    "&:hover": { bgcolor: "#d66f00" },
                    fontWeight: 700,
                    py: 1.5,
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontSize: "0.95rem",
                    boxShadow: "0 4px 14px rgba(239, 125, 0, 0.35)",
                  }}
                >
                  Buat Purchase Request (Checkout)
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  size="medium"
                  onClick={() => navigate(`${prefix}/marketplace`)}
                  sx={{
                    mt: 1.5,
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "divider",
                    color: "text.secondary",
                    "&:hover": { borderColor: "#ef7d00", color: "#ef7d00", bgcolor: "transparent" },
                  }}
                >
                  Lanjut Belanja di Marketplace
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Layout>
  );
}
