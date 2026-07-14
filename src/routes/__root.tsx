import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Plane } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-4 text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => reportLovableError(error, { boundary: "root" }), [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Travel Smart — Hotels, Flights & Tours" },
      { name: "description", content: "Find and book hotels, flights, tours and activities at great prices. Curated travel deals in one place." },
      { property: "og:title", content: "Travel Smart — Hotels, Flights & Tours" },
      { property: "og:description", content: "Find and book hotels, flights, tours and activities at great prices. Curated travel deals in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Travel Smart — Hotels, Flights & Tours" },
      { name: "twitter:description", content: "Find and book hotels, flights, tours and activities at great prices. Curated travel deals in one place." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f1d6b238-93cb-4ba1-b299-84fb911b53c0/id-preview-29f02c5d--227220ae-8f04-4096-ba73-b9f10d10c453.lovable.app-1784068369983.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f1d6b238-93cb-4ba1-b299-84fb911b53c0/id-preview-29f02c5d--227220ae-8f04-4096-ba73-b9f10d10c453.lovable.app-1784068369983.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
    scripts: [
      {
        children: `(function(){var s=document.createElement("script");s.async=1;s.src='https://tp-em.com/NTUwNTcz.js?t=550573';document.head.appendChild(s);})();`,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});


function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  const { isAdmin } = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Plane className="h-4 w-4" />
          </span>
          <span className="text-xl font-bold tracking-tight">Travel Smart</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/" className="opacity-90 hover:opacity-100 [&.active]:font-semibold">Browse</Link>
          {isAdmin && (
            <>
              <Link to="/admin" className="opacity-90 hover:opacity-100 [&.active]:font-semibold">Admin</Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="rounded-md border border-primary-foreground/30 px-3 py-1.5 text-xs font-medium hover:bg-primary-foreground/10"
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function DisclaimerModal() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionStorage.getItem("ts_notice_seen")) setOpen(true);
  }, []);
  if (!open) return null;
  const dismiss = () => {
    sessionStorage.setItem("ts_notice_seen", "1");
    setOpen(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <h2 className="text-lg font-bold">Before you book</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          No transactions take place on this site. When you click <span className="font-semibold text-foreground">Book Now</span>, you'll be taken to a trusted booking partner (such as Booking.com, Agoda, Kiwi or GetYourGuide) where your reservation is completed securely.
        </p>
        <button
          onClick={dismiss}
          className="mt-6 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Header />
        <Outlet />
        <footer className="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Travel Smart. Bookings are completed on partner sites.</p>
        </footer>
      </div>
      <DisclaimerModal />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
