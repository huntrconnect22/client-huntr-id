import React, { useEffect, useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { adminGetTransactions, adminGetEscrowSummary } from "../../lib/api";

export default function AdminTransactionsTab() {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchData = async (page = currentPage, s = search) => {
    setIsLoading(true);
    try {
      const [sumRes, txRes] = await Promise.all([
        adminGetEscrowSummary(),
        adminGetTransactions({ page, per_page: perPage, search: s }),
      ]);
      setSummary(sumRes);
      setTransactions(txRes.data || []);
      setCurrentPage(txRes.current_page || 1);
      setTotalPages(txRes.last_page || 1);
      setTotal(txRes.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchData(1, search), 400);
    return () => clearTimeout(t);
  }, [search]);

  if (isLoading) {
    return (
      <div style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}>
        <Loader2
          className="animate-spin"
          size={28}
          style={{ color: "var(--ui-status-approved)" }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Escrow summary card */}
      <div
        style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          borderRadius: 14,
          padding: "clamp(20px, 5vw, 28px)",
          color: "#fff",
          boxShadow: "0 6px 20px rgba(16,185,129,0.25)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            opacity: 0.85,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Total Escrow Balance
        </div>
        <div
          style={{
            fontSize: "clamp(26px, 7vw, 44px)",
            fontWeight: 900,
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          Rp {summary?.total_escrow_amount?.toLocaleString() || 0}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
          From {summary?.total_invoices_held || 0} invoices waiting for
          finance disbursement
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--ui-bg-input)",
          border: "1px solid var(--ui-border-input)",
          borderRadius: 10,
          padding: "9px 14px",
        }}
      >
        <Search size={14} color="var(--ui-text-muted)" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari PO number, buyer, vendor…"
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--ui-text-primary)",
            width: "100%",
            fontSize: 13,
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ui-text-muted)",
              padding: 0,
              display: "flex",
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* List header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "var(--ui-text-primary)",
          }}
        >
          Global Transactions
        </div>
        <span
          style={{ fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 400 }}
        >
          {total.toLocaleString()} total
        </span>
      </div>

      {/* Transaction cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {transactions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--ui-text-muted)",
            }}
          >
            No transactions found
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              style={{
                background: "var(--ui-bg-card)",
                border: "1px solid var(--ui-border)",
                borderRadius: 12,
                padding: "14px 16px",
                transition: "border-color 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 14,
                      color: "var(--ui-text-primary)",
                    }}
                  >
                    {tx.po_number}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ui-text-muted)",
                      marginTop: 3,
                    }}
                  >
                    Buyer: {tx.buyer?.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ui-text-muted)",
                    }}
                  >
                    Vendor: {tx.vendor?.name}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--ui-text-primary)",
                    }}
                  >
                    Rp {tx.total_amount?.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      background: "var(--ui-primary-muted)",
                      color: "var(--ui-primary)",
                      border: "1px solid var(--ui-primary-border)",
                      padding: "2px 8px",
                      borderRadius: 6,
                      display: "inline-block",
                      marginTop: 4,
                      fontWeight: 700,
                    }}
                  >
                    {tx.status}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={() => fetchData(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              background:
                currentPage === 1
                  ? "var(--ui-bg-input)"
                  : "var(--ui-primary-muted)",
              color:
                currentPage === 1 ? "var(--ui-text-muted)" : "var(--ui-primary)",
              transition: "all 0.15s",
            }}
          >
            ← Prev
          </button>
          <span
            style={{ fontSize: 12, color: "var(--ui-text-muted)" }}
          >
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() =>
              fetchData(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              cursor:
                currentPage === totalPages ? "not-allowed" : "pointer",
              background:
                currentPage === totalPages
                  ? "var(--ui-bg-input)"
                  : "var(--ui-primary-muted)",
              color:
                currentPage === totalPages
                  ? "var(--ui-text-muted)"
                  : "var(--ui-primary)",
              transition: "all 0.15s",
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
