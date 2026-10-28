import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
  className,
}) => {
  return (
    <div
      className={`skeleton ${className || ""}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

// Skeleton variants for common patterns
export const SkeletonText: React.FC<{ lines?: number; lastLineWidth?: string }> = ({
  lines = 3,
  lastLineWidth = "70%",
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 ? lastLineWidth : "100%"}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div
      style={{
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
        borderRadius: 20,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton width={200} height={24} />
        <Skeleton width={80} height={32} borderRadius={12} />
      </div>

      {/* Content rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Skeleton width={40} height={40} borderRadius={12} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div
      style={{
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 16,
          padding: "16px 24px",
          borderBottom: "1px solid var(--ui-border-subtle)",
          background: "var(--ui-bg-input)",
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width="80%" height={14} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 16,
            padding: "16px 24px",
            borderBottom:
              rowIndex < rows - 1 ? "1px solid var(--ui-border-subtle)" : "none",
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width="90%" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--ui-bg-card)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            padding: 20,
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <Skeleton width={60} height={60} borderRadius={12} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton width="40%" height={20} />
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={14} />
          </div>
          <Skeleton width={100} height={36} borderRadius={12} />
        </div>
      ))}
    </div>
  );
};

export const SkeletonGrid: React.FC<{ items?: number; columns?: number }> = ({
  items = 6,
  columns = 3,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 20,
      }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--ui-bg-card)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Skeleton width="100%" height={150} borderRadius={12} />
          <Skeleton width="80%" height={18} />
          <Skeleton width="60%" height={14} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <Skeleton width={80} height={32} borderRadius={10} />
            <Skeleton width={80} height={32} borderRadius={10} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return <Skeleton width={size} height={size} borderRadius="50%" />;
};

export const SkeletonButton: React.FC<{ width?: string | number }> = ({
  width = 120,
}) => {
  return <Skeleton width={width} height={40} borderRadius={12} />;
};

export default Skeleton;
