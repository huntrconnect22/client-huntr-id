import React from "react";
import Layout from "../Layout";
import WeatherWidget from "../WeatherWidget";
import CurrencyWidget from "../CurrencyWidget";
import { 
  PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  LineChart as RechartsLineChart, Line, AreaChart, Area, CartesianGrid, XAxis, YAxis
} from "recharts";
import { 
  Activity, AlertTriangle, Clock, DollarSign, TrendingDown, PieChart, LineChart, ArrowDownCircle, ClipboardList, ChevronLeft, ChevronRight
} from "lucide-react";

const chartTooltipStyle = (accent?: string) => ({
  contentStyle: {
    backgroundColor: "var(--ui-chart-tooltip-bg)",
    border: accent ?? "1px solid var(--ui-chart-tooltip-border)",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  },
  itemStyle: { color: "var(--ui-chart-tooltip-text)" },
  labelStyle: { color: "var(--ui-chart-legend)" },
});

import { getOrders } from "../../lib/api";
import { useMediaQuery, MOBILE_BREAKPOINT } from "../../hooks/useMediaQuery";

const DEPARTMENT_SPEND_PAGE_SIZE = 4;

function DepartmentSpendMobileList({
  data,
  colors,
  formatCurrency,
  total,
}: {
  data: { name: string; value: number }[];
  colors: string[];
  formatCurrency: (v: number) => string;
  total: number;
}) {
  const sorted = React.useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
  const [page, setPage] = React.useState(0);
  const totalPages = Math.max(1, Math.ceil(sorted.length / DEPARTMENT_SPEND_PAGE_SIZE));

  React.useEffect(() => {
    setPage(0);
  }, [sorted.length]);

  React.useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const pageItems = sorted.slice(
    page * DEPARTMENT_SPEND_PAGE_SIZE,
    page * DEPARTMENT_SPEND_PAGE_SIZE + DEPARTMENT_SPEND_PAGE_SIZE,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pageItems.map((item, index) => {
          const globalIndex = page * DEPARTMENT_SPEND_PAGE_SIZE + index;
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          const color = colors[globalIndex % colors.length];
          return (
            <div key={item.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ui-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text-primary)" }}>{formatCurrency(item.value)}</span>
                  <span style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>{pct.toFixed(1)}%</span>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--ui-bg-input)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, minWidth: pct > 0 ? 4 : 0 }} />
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 4, borderTop: "1px solid var(--ui-border)" }}>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous page"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--ui-border)",
              background: "var(--ui-bg-input)",
              color: page === 0 ? "var(--ui-text-muted)" : "var(--ui-text-primary)",
              cursor: page === 0 ? "not-allowed" : "pointer",
              opacity: page === 0 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ui-text-muted)" }}>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--ui-border)",
              background: "var(--ui-bg-input)",
              color: page >= totalPages - 1 ? "var(--ui-text-muted)" : "var(--ui-text-primary)",
              cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: page >= totalPages - 1 ? 0.5 : 1,
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export function BuyerDashboard({ user, activeCompany }: { user: any, activeCompany: any }) {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const [realSpendData, setRealSpendData] = React.useState<{ name: string; value: number }[]>([]);
  const [totalRealSpend, setTotalRealSpend] = React.useState<number>(0);
  const [loadingOrders, setLoadingOrders] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!activeCompany?.id) return;
    setLoadingOrders(true);
    getOrders(activeCompany.id, 1, 100)
      .then((res) => {
        const orders = res?.data || [];
        const deptMap: Record<string, number> = {};
        let total = 0;

        orders.forEach((po: any) => {
          const amt = Number(po.total_amount || 0);
          total += amt;
          const dept = po.department || po.purchase_category || "General";
          deptMap[dept] = (deptMap[dept] || 0) + amt;
        });

        const formatted = Object.entries(deptMap).map(([name, value]) => ({ name, value }));
        setRealSpendData(formatted.length > 0 ? formatted : [{ name: "General", value: 0 }]);
        setTotalRealSpend(total);
      })
      .catch((err) => {
        console.error("Failed to load real dashboard spend data", err);
      })
      .finally(() => {
        setLoadingOrders(false);
      });
  }, [activeCompany?.id]);

  const COLORS = ['#fb923c', '#fbbf24', '#f87171', '#60a5fa', '#34d399', '#a78bfa'];

  const cycleTimeData = [
    { month: 'Jan', time: 3.2 },
    { month: 'Feb', time: 2.8 },
    { month: 'Mar', time: 2.5 },
    { month: 'Apr', time: 2.1 },
    { month: 'May', time: 1.9 },
    { month: 'Jun', time: 1.8 },
  ];

  const savingsData = [
    { month: 'Jan', savings: 150000000 },
    { month: 'Feb', savings: 320000000 },
    { month: 'Mar', savings: 480000000 },
    { month: 'Apr', savings: 750000000 },
    { month: 'May', savings: 980000000 },
    { month: 'Jun', savings: 1200000000 },
  ];

  const [currencyState, setCurrencyState] = React.useState<{ baseCurrency: string; rates: Record<string, { code: string; value: number }> }>({ baseCurrency: 'IDR', rates: {} });

  React.useEffect(() => {
    const handleCurrencyUpdate = (e: any) => {
      setCurrencyState(e.detail);
    };
    window.addEventListener('currency-update', handleCurrencyUpdate);
    return () => window.removeEventListener('currency-update', handleCurrencyUpdate);
  }, []);

  const formatCurrency = (valueIdr: number | string | null | undefined) => {
    const numeric = Number(valueIdr ?? 0);
    if (isNaN(numeric)) return 'Rp 0';
    
    const base = currencyState.baseCurrency ?? 'IDR';
    let convertedValue = numeric;
    let symbol = 'Rp';
    
    if (base !== 'IDR' && currencyState.rates['IDR']?.value) {
      convertedValue = numeric / currencyState.rates['IDR'].value;
      symbol = base === 'USD' ? '$' : 
               base === 'EUR' ? '€' : 
               base === 'SGD' ? 'S$' : 
               base === 'MYR' ? 'RM' : 
               base === 'JPY' ? '¥' : base + ' ';
    }
    
    const absVal = Math.abs(convertedValue);
    let div = 1;
    let suffix = '';
    
    if (absVal >= 1000000000) { div = 1000000000; suffix = 'B'; }
    else if (absVal >= 1000000) { div = 1000000; suffix = 'M'; }
    else if (absVal >= 1000) { div = 1000; suffix = 'k'; }
    
    return `${convertedValue < 0 ? '- ' : ''}${symbol} ${Math.abs(convertedValue / div).toFixed(1)}${suffix}`;
  };

  const downloadCSV = (title: string, headers: string[], data: any[][]) => {
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...data.map(row => row.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSpendData = () => {
    const headers = ["Department", "Spend Amount (IDR)"];
    const rows = realSpendData.map(item => [item.name, item.value]);
    downloadCSV("Spend_Analysis_by_Department", headers, rows);
  };

  const handleDownloadCycleTimeData = () => {
    const headers = ["Month", "Cycle Time (Days)"];
    const rows = cycleTimeData.map(item => [item.month, item.time]);
    downloadCSV("PO_Cycle_Time_Avg", headers, rows);
  };

  const handleDownloadSavingsData = () => {
    const headers = ["Month", "Cumulative Savings (IDR)"];
    const rows = savingsData.map(item => [item.month, item.savings]);
    downloadCSV("Cost_Savings_YTD", headers, rows);
  };

  const handleDownloadOverallStats = () => {
    const headers = ["Metric", "Value", "Notes"];
    const rows = [
      ["Total Spend", "12500000000", "4.2% vs last month"],
      ["Maverick Spend", "8.5%", "Off-contract purchases"],
      ["Defect Rate", "2.1%", "Target: <2.0%"],
      ["Lead Time Avg", "7.2 Days", "PO to Goods Receipt"],
      ["Active PO", "8", "In-Transit"],
      ["Unprocessed PRs", "24", "Needs review"],
      ["POs/Staff/Mo", "45", "Average"],
      ["PPV", "-450000000", "Favorable variance"]
    ];
    downloadCSV("Procurement_Key_Performance_Metrics", headers, rows);
  };

  return (
    <Layout title="Procurement Dashboard" subtitle="Overview of your organization's spend, supplier performance, and operational efficiency.">
      <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40, boxSizing: "border-box", width: "100%" }}>
        {/* Weather + Currency compact row */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "stretch" }}>
          <WeatherWidget embedded />
          <CurrencyWidget embedded />
        </section>
        
        {/* 1. Spend Analysis — stat cards compact, chart full width */}
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 0 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, color: "#fb923c" }}>
              <PieChart size={18} /> Analisis Pengeluaran (Spend Analysis)
            </h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button 
                onClick={handleDownloadOverallStats} 
                style={{ 
                  background: "rgba(249,115,22,0.1)", 
                  border: "1px solid rgba(249,115,22,0.3)", 
                  color: "#fb923c", 
                  padding: "4px 10px", 
                  borderRadius: 8, 
                  fontSize: 11, 
                  fontWeight: 700, 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <ArrowDownCircle size={14} /> Download Metrics
              </button>
              <button 
                onClick={handleDownloadSpendData} 
                style={{ 
                  background: "rgba(249,115,22,0.1)", 
                  border: "1px solid rgba(249,115,22,0.3)", 
                  color: "#fb923c", 
                  padding: "4px 10px", 
                  borderRadius: 8, 
                  fontSize: 11, 
                  fontWeight: 700, 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <ArrowDownCircle size={14} /> Download Spend Excel
              </button>
            </div>
          </div>
          {/* Stat cards row — compact, small */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "14px 16px", borderLeft: "3px solid #f97316" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Total Spend</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ui-text-primary)", marginTop: 4, lineHeight: 1 }}>{formatCurrency(totalRealSpend)}</div>
              <div style={{ fontSize: 10, color: "#34d399", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}><TrendingDown size={10}/> Real PO Aggregation</div>
            </div>
            <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Maverick Spend</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#ef4444", marginTop: 4, lineHeight: 1 }}>0%</div>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>Off-contract purchases</div>
            </div>
            <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Defect Rate</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#22c55e", marginTop: 4, lineHeight: 1 }}>0.0%</div>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>Target: &lt;2.0%</div>
            </div>
            <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Lead Time Avg</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#60a5fa", marginTop: 4, lineHeight: 1 }}>7.0 Days</div>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>PO → Goods Receipt</div>
            </div>
          </div>
          {/* Chart — full width */}
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: isMobile ? "14px 16px" : "18px 20px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pengeluaran per Departemen</h3>
            {loadingOrders ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: isMobile ? 80 : 260, fontSize: 12, color: "var(--ui-text-muted)" }}>
                Mengambil data PO...
              </div>
            ) : realSpendData.length === 0 || (realSpendData.length === 1 && realSpendData[0].value === 0) ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: isMobile ? 80 : 260, fontSize: 12, color: "var(--ui-text-muted)" }}>
                Belum ada transaksi PO untuk dihitung pengeluarannya.
              </div>
            ) : isMobile ? (
              <DepartmentSpendMobileList
                data={realSpendData}
                colors={COLORS}
                formatCurrency={formatCurrency}
                total={totalRealSpend}
              />
            ) : (
              <div style={{ height: 260, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={realSpendData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                      {realSpendData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} {...chartTooltipStyle()} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--ui-chart-legend)" }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* 2. Operational Efficiency */}
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, color: "#60a5fa" }}>
              <Activity size={18} /> Efisiensi Operasional
            </h2>
            <button 
              onClick={handleDownloadCycleTimeData} 
              style={{ 
                background: "rgba(59,130,246,0.1)", 
                border: "1px solid rgba(59,130,246,0.3)", 
                color: "#60a5fa", 
                padding: "4px 10px", 
                borderRadius: 8, 
                fontSize: 11, 
                fontWeight: 700, 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <ArrowDownCircle size={14} /> Download Cycle Time Excel
            </button>
          </div>
          {/* Stat cards row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Active PO</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fb923c", marginTop: 4, lineHeight: 1 }}>8</div>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>In-Transit</div>
            </div>
            <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Unprocessed PRs</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ui-text-primary)", marginTop: 4, lineHeight: 1 }}>24</div>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>Needs review</div>
            </div>
            <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>POs/Staff/Mo</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f472b6", marginTop: 4, lineHeight: 1 }}>45</div>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>Average</div>
            </div>
          </div>
          {/* Line chart — full width */}
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "16px 20px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Rata-rata Waktu Siklus PO (Hari)</h3>
            <div style={{ height: 260, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={cycleTimeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-chart-grid)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--ui-chart-axis)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--ui-chart-axis)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 4]} />
                  <Tooltip {...chartTooltipStyle("1px solid rgba(59,130,246,0.35)")} />
                  <Line type="monotone" dataKey="time" name="Cycle Time (Days)" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4, fill: "#2563eb", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* 3. Financial & Cost Management */}
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, color: "#fbbf24" }}>
              <LineChart size={18} /> Keuangan &amp; Penghematan
            </h2>
            <button 
              onClick={handleDownloadSavingsData} 
              style={{ 
                background: "rgba(251,191,36,0.1)", 
                border: "1px solid rgba(251,191,36,0.3)", 
                color: "#fbbf24", 
                padding: "4px 10px", 
                borderRadius: 8, 
                fontSize: 11, 
                fontWeight: 700, 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <ArrowDownCircle size={14} /> Download Savings Excel
            </button>
          </div>
          {/* Stat card */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "14px 16px", borderLeft: "3px solid #34d399" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>PPV</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399", marginTop: 4, lineHeight: 1 }}>{formatCurrency(-450000000)}</div>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>Favorable variance</div>
            </div>
          </div>
          {/* Area chart — full width */}
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "16px 20px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Kumulatif Penghematan Cost (YTD)</h3>
            <div style={{ height: 260, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savingsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-chart-grid)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--ui-chart-axis)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--ui-chart-axis)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), "Savings"]}
                    {...chartTooltipStyle("1px solid rgba(245,158,11,0.35)")}
                  />
                  <Area type="monotone" dataKey="savings" name="Cost Savings" stroke="#fbbf24" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
