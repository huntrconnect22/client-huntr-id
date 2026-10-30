import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";
import { Box, Typography, Stack } from "@mui/material";
import { LayoutDashboard, ShoppingCart, Warehouse, ContactRound } from "lucide-react";
import "../../app/app.css";
import { ThemeProvider } from "../../app/context/ThemeContext";
import { LanguageProvider } from "../../app/context/LanguageContext";
import ThemeToggle from "../../app/shared/components/ThemeToggle";
import Modal from "../../app/shared/components/Modal";
import Toast from "../../app/shared/components/Toast";
import Skeleton from "../../app/shared/components/Skeleton";
import { Button } from "../../app/shared/ui/Button";
import { Input, Select, Textarea } from "../../app/shared/ui/Fields";
import { Surface } from "../../app/shared/ui/Surface";
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from "../../app/shared/ui/Table";
import { BottomNavigation } from "../../app/modules/shell/src/components/BottomNavigation";
import { AppDrawer } from "../../app/modules/shell/src/components/AppDrawer";
import { AppTopbar } from "../../app/modules/shell/src/components/AppTopbar";

const navItems = [
  { to: "/", label: "Overview", Icon: LayoutDashboard, section: "main", exact: true },
  { to: "/orders", label: "Purchase orders", Icon: ShoppingCart, section: "procurement", badge: "orders" },
  { to: "/wms", label: "Warehouse", Icon: Warehouse, section: "main" },
  { to: "/crm", label: "CRM", Icon: ContactRound, section: "main" },
];

function Review() {
  const { pathname } = useLocation();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const [fileName, setFileName] = useState("");
  const [topbarMenu, setTopbarMenu] = useState<"user" | "notifications" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
    <AppTopbar title="Budgeting & Procurement Plan" subtitle="Monitor procurement commitments and budget allocations across your company."
      breadcrumb={<nav className="huntr-breadcrumb-scroll">PT Northern Lords / Procurement / Budgeting</nav>}
      status={<Button type="button">Enterprise Pro</Button>}
      user={{ name: "Alexandra Putri Pratama", email: "alexandra.pratama@example.com" }}
      cartCount={12} unreadCount={105} notificationsOpen={topbarMenu === "notifications"} userMenuOpen={topbarMenu === "user"}
      onHome={() => setTopbarMenu(null)} onCart={() => setToast(true)}
      onNotifications={() => setTopbarMenu(topbarMenu === "notifications" ? null : "notifications")}
      onUserMenu={() => setTopbarMenu(topbarMenu === "user" ? null : "user")}
      userMenu={topbarMenu === "user" && <Surface style={{ position: "absolute", top: 52, right: 0, width: 210, padding: 16 }}>Alexandra Putri Pratama<br />Account settings</Surface>}
      notificationMenu={topbarMenu === "notifications" && <Surface style={{ position: "absolute", top: 52, right: 0, width: 240, padding: 16 }}>Notifications<br />No new updates</Surface>}
    />
    <Box sx={{ maxWidth: 1120, mx: "auto", px: { xs: 2, sm: 4 }, py: 3, pb: 14 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography>Theme preview</Typography><ThemeToggle />
      </Stack>
      <Typography variant="h1" sx={{ mb: 1 }}>Workspace overview</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>UI preview · sample data · no API requests</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: 3 }}>
        <Surface style={{ padding: 24 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Procurement request</Typography>
          <form onSubmit={e => { e.preventDefault(); setSubmitted(String(new FormData(e.currentTarget).get("reference"))); setToast(true); }}>
            <Stack spacing={2}>
              <label htmlFor="review-reference">Reference</label>
              <Input id="review-reference" name="reference" placeholder="Enter a reference" required ref={inputRef} />
              <label htmlFor="review-warehouse">Warehouse</label>
              <Select id="review-warehouse" name="warehouse" defaultValue="main"><option value="main">Main warehouse</option><option value="branch">Branch warehouse</option></Select>
              <label htmlFor="review-note">Notes</label><Textarea id="review-note" name="notes" placeholder="Delivery instructions" />
              <label><Input type="checkbox" name="urgent" /> Urgent delivery</label>
              <Input aria-label="Import file" type="file" accept=".csv" onChange={e => setFileName(e.target.files?.[0]?.name ?? "")} />
              {fileName && <span>{fileName}</span>}
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
                <Button variant="contained">Save preview</Button>
                <Button type="button" onClick={() => setModal(true)}>Open dialog</Button>
                <Button type="button" disabled>Disabled action</Button>
                <Button type="button" onClick={() => inputRef.current?.focus()}>Focus reference</Button>
              </Stack>
            </Stack>
          </form>
          <Typography role="status" sx={{ mt: 2 }}>{submitted ? `Saved: ${submitted}` : "No data submitted"}</Typography>
        </Surface>
        <Surface style={{ padding: 24, overflow: "auto" }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Inventory by warehouse</Typography>
          <Table aria-label="Sample inventory"><TableHead><TableRow><TableHeaderCell>Item</TableHeaderCell><TableHeaderCell align="right">Quantity</TableHeaderCell></TableRow></TableHead>
            <TableBody><TableRow><TableCell>Office supplies</TableCell><TableCell align="right">24</TableCell></TableRow><TableRow><TableCell>Packaging</TableCell><TableCell align="right">120</TableCell></TableRow></TableBody>
          </Table>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4, mb: 1 }}>Loading state</Typography><Skeleton height={24} />
          <Typography variant="body2" sx={{ mt: 4 }}>Current route: {pathname}</Typography>
        </Surface>
      </Box>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Review request" subtitle="Keyboard focus stays inside this dialog.">
        <Box sx={{ p: 3 }}><label htmlFor="review-confirmation">Confirmation note</label><Input id="review-confirmation" style={{ width: "100%", marginTop: 12 }} /><Button type="button" style={{ marginTop: 16 }} onClick={() => setModal(false)}>Done</Button></Box>
      </Modal>
      <Toast message="Preview saved" type="success" isVisible={toast} onClose={() => setToast(false)} duration={0} />
      <BottomNavigation navItems={navItems} pathname={pathname} pendingCounts={{ orders: 3 }} onOpenMenu={() => setDrawer(true)} />
      <AppDrawer navItems={navItems} pathname={pathname} pendingCounts={{ orders: 3 }} open={drawer} onClose={() => setDrawer(false)} onNavigate={() => setDrawer(false)} />
    </Box>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<MemoryRouter><LanguageProvider><ThemeProvider><Review /></ThemeProvider></LanguageProvider></MemoryRouter>);
