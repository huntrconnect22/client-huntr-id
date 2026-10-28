import React from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { EventBusProvider } from "./shared/lib/EventBus";
import WebSocketDebug from "~/shared/components/WebSocketDebug";
import MaintenanceBanner from "~/shared/components/MaintenanceBanner";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "icon", type: "image/svg+xml", href: "/assets/img/logo/favicon.svg" },
  { rel: "icon", type: "image/png", href: "/assets/img/logo/favicon.png" },
];

function CanonicalLink() {
  let pathname = "";
  try {
    const location = useLocation();
    pathname = location?.pathname || "";
  } catch {
    if (typeof window !== "undefined") {
      pathname = window.location.pathname;
    }
  }
  return <link rel="canonical" href={`https://app.huntr.id${pathname}`} />;
}

export function Layout({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    try {
      const t = localStorage.getItem('huntr_theme');
      if (t) {
        document.documentElement.setAttribute('data-theme', t);
        document.documentElement.classList.toggle('dark', t === 'dark');
      } else {
        const sys = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', sys);
        document.documentElement.classList.toggle('dark', sys === 'dark');
      }
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <CanonicalLink />
        {/* Restore theme before first paint — fallback to system preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('huntr_theme');if(t){document.documentElement.setAttribute('data-theme',t);}else{var sys=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.setAttribute('data-theme',sys);}}catch(e){}})();`,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <ThemeProvider>
            <EventBusProvider>
              {children}
              <WebSocketDebug />
              <MaintenanceBanner />
            </EventBusProvider>
          </ThemeProvider>
        </LanguageProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";

  return (
    <>
      {isNavigating && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, #f97316 0%, #ff8c3a 50%, #f97316 100%)",
          backgroundSize: "200% 100%",
          animation: "loading-bar-pulse 1.2s infinite linear, loading-bar-progress 2.5s forwards",
          zIndex: 9999,
        }} />
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading-bar-pulse {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes loading-bar-progress {
          0% { width: 0%; }
          100% { width: 90%; }
        }
      `}} />
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
