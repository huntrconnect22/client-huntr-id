import React from "react";

interface CataloguePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function CataloguePagination({
  currentPage,
  totalPages,
  onPageChange,
}: CataloguePaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        marginTop: 24,
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: "7px 14px",
          borderRadius: 6,
          border: "1px solid var(--ui-border)",
          background: "var(--ui-bg-card)",
          color: "var(--ui-text-primary)",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          opacity: currentPage === 1 ? 0.5 : 1,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Previous
      </button>

      {pages.map((page, index) =>
        typeof page === "number" ? (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: currentPage === page ? "none" : "1px solid var(--ui-border)",
              background: currentPage === page ? "var(--huntr-orange)" : "var(--ui-bg-card)",
              color: currentPage === page ? "#fff" : "var(--ui-text-primary)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {page}
          </button>
        ) : (
          <span
            key={`ellipsis-${index}`}
            style={{ padding: "0 4px", color: "var(--ui-text-muted)", fontSize: 12, fontWeight: 600 }}
          >
            ...
          </span>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: "7px 14px",
          borderRadius: 6,
          border: "1px solid var(--ui-border)",
          background: "var(--ui-bg-card)",
          color: "var(--ui-text-primary)",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          opacity: currentPage === totalPages ? 0.5 : 1,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Next
      </button>
    </div>
  );
}
