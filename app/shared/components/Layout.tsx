/**
 * Layout.tsx — Thin Page Content Wrapper
 *
 * Used by every route page to set the page title/subtitle in the persistent
 * AppShell header (via Outlet context). It no longer renders the sidebar or
 * notification sound — those live in _app.tsx.
 *
 * All existing route files call <Layout title="..." subtitle="...">
 * and continue to work unchanged.
 */
import React, { useEffect } from "react";
import { useOutletContext } from "react-router";

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface ShellContext {
  setPageTitle: (t: string) => void;
  setPageSubtitle: (s: string) => void;
}

export default function Layout({ children, title, subtitle }: Props) {
  // Get context from the persistent AppShell (_app.tsx).
  // This is always available since all authenticated routes are nested under _app.tsx.
  const ctx = useOutletContext<ShellContext | null>();

  useEffect(() => {
    if (ctx?.setPageTitle) {
      ctx.setPageTitle(title);
      ctx.setPageSubtitle(subtitle ?? "");
    } else {
      // Fallback: update the browser tab title directly
      document.title = `${title} — Huntr.id`;
    }
  }, [title, subtitle, ctx]);

  // The shell (_app.tsx) already renders the outer container, sidebar, header, etc.
  // This component just renders the page content directly.
  return <>{children}</>;
}
