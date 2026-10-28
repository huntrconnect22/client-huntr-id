import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const paths = pathname.split("/").filter(Boolean);
  const [breadcrumbOverrides, setBreadcrumbOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const overrides: Record<string, string> = {};
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("breadcrumb:")) {
        overrides[key.replace("breadcrumb:", "")] = sessionStorage.getItem(key) ?? "";
      }
    }

    setBreadcrumbOverrides(overrides);
  }, [pathname]);

  if (paths.length === 0) {
    return null; // Don't show breadcrumb on home page if you don't want to, or show just Home.
  }

  return (
    <nav className="huntr-breadcrumb-scroll flex items-center gap-2 text-[12px] px-1 transition-colors whitespace-nowrap">
      <Link 
        to="/" 
        className="text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] transition-colors flex items-center"
      >
        <Home size={14} />
      </Link>
      
      {paths.map((path, idx) => {
        const isLast = idx === paths.length - 1;
        const to = `/${paths.slice(0, idx + 1).join("/")}`;
        const override = isLast ? breadcrumbOverrides[to] : undefined;
        const name =
          (isLast && override) ||
          path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

        return (
          <React.Fragment key={path}>
            <ChevronRight size={14} className="text-[var(--ui-text-muted)] opacity-50" />
            {isLast ? (
              <span className="text-[var(--ui-text-primary)] font-bold">{name}</span>
            ) : (
              <Link 
                to={to} 
                className="text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] no-underline transition-colors"
              >
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
