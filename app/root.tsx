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
import { EventBusProvider } from "./lib/EventBus";
import WebSocketDebug from "./components/WebSocketDebug";

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

export function Layout({ children }: { children: React.ReactNode }) {
  // Get theme from localStorage on client side to avoid hydration mismatch
  const [theme, setTheme] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const t = localStorage.getItem('huntr_theme');
      if (t) {
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);
      } else {
        const sys = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        setTheme(sys);
        document.documentElement.setAttribute('data-theme', sys);
      }
    } catch (e) {
      setTheme('dark');
    }
  }, []);

  const location = useLocation();
  const canonicalUrl = `https://app.huntr.id${location.pathname}`;

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonicalUrl} />
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
        <ThemeProvider>
          <EventBusProvider>
            {children}
            <WebSocketDebug />
          </EventBusProvider>
        </ThemeProvider>
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
