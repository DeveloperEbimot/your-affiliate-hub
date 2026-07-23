import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function TpWidget({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const s = document.createElement("script");
    s.async = true;
    s.charset = "utf-8";
    s.src = src;
    ref.current.appendChild(s);
  }, [src]);
  return <div ref={ref} className="tp-widget w-full overflow-hidden" />;
}

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: string | null;
  amazon_url: string;
  category_id: string | null;
  featured: boolean;
  listing_type: string | null;
  location: string | null;
};

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Travel Smart — Hotels, Flights & Tours" },
      { name: "description", content: "Search hotels, flights, tours and activities at great prices. Curated travel deals in one place." },
      { property: "og:title", content: "Travel Smart — Hotels, Flights & Tours" },
      { property: "og:description", content: "Search hotels, flights, tours and activities at great prices. Curated travel deals in one place." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://travelersmart.lovable.app" },
    ],
    links: [
      { rel: "canonical", href: "https://travelersmart.lovable.app" },
    ],
    scripts: [
      {
        type: "text/javascript",
        children: `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A7499928-0fe7-4acf-9187-e65ef668c8631.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`,
      },
    ],
  }),
});

function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [cats, prods] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
      ]);
      setCategories(cats.data ?? []);
      setProducts((prods.data as Product[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat && p.category_id !== activeCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, activeCat]);

  return (
    <main>
      {/* Hero — booking.com style blue banner with floating search */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:pt-12 sm:pb-24">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Find your next trip
          </h1>
          <p className="mt-3 text-primary-foreground/80 max-w-xl">
            Search hotels, flights, tours and activities — all in one place.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* Floating search bar */}
        <div className="-mt-8 sm:-mt-10 rounded-xl border-2 border-accent bg-card p-2 shadow-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Where are you going? Try 'Paris' or 'beach tour'"
              className="w-full rounded-lg bg-background py-3 pl-12 pr-4 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Flight search form */}
        <section className="mt-6">
          <TpWidget src="https://tpwgts.com/content?currency=usd&trs=550573&shmarker=751177&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%2332a8dd&color_icons=%2332a8dd&dark=%23262626&light=%23ffffff&secondary=%233FABDB&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=0&plain=false&promo_id=7879&campaign_id=100" />
        </section>

        {/* Explore prices on the map — compact, corner card like booking.com */}
        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-lg font-bold">Explore prices on the map</h2>
            <p className="text-sm text-muted-foreground">Drag and zoom to find deals from London.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl overflow-hidden border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="h-[320px] sm:h-[380px]">
                <TpWidget src="https://tpwgts.com/content?currency=usd&trs=550573&shmarker=751177&lat=51.5073509&lng=-0.1277583&powered_by=true&search_host=www.aviasales.com%2Fsearch&locale=en&origin=LON&value_min=0&value_max=1000000&round_trip=true&only_direct=false&radius=1&draggable=true&disable_zoom=false&show_logo=false&scrollwheel=false&primary=%233FABDB&secondary=%233FABDB&light=%23ffffff&width=800&height=380&zoom=3&promo_id=4054&campaign_id=100" />
              </div>
            </div>
            <aside className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-base font-bold">Your journey begins here</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We search hundreds of travel sites at once to find the cheapest flights and stays for you.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> Compare prices across airlines</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> Flexible dates & nearby airports</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> Secure checkout on partner sites</li>
              </ul>
            </aside>
          </div>
        </section>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 py-6">
          <CategoryChip active={activeCat === null} onClick={() => setActiveCat(null)}>
            All
          </CategoryChip>
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              active={activeCat === c.id}
              onClick={() => setActiveCat(c.id)}
            >
              {c.name}
            </CategoryChip>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {products.length === 0
              ? "No listings yet."
              : "No listings match your search."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
            {filtered.map((p) => (
              <ListingCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}

function ListingCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        {product.featured && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-accent text-accent-foreground text-xs font-bold px-2 py-1">
            <Star className="h-3 w-3 fill-current" /> Featured
          </span>
        )}
        {product.listing_type && (
          <span className="absolute top-2 right-2 rounded-md bg-primary/90 text-primary-foreground text-xs font-semibold px-2 py-1 capitalize">
            {product.listing_type}
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-base font-semibold line-clamp-2">{product.name}</h3>
        {product.location && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {product.location}
          </div>
        )}
        <div className="mt-auto pt-3 flex items-end justify-between">
          {product.price ? (
            <div>
              <div className="text-xs text-muted-foreground">from</div>
              <div className="text-lg font-bold text-primary">{product.price}</div>
            </div>
          ) : <span />}
          <span className="rounded-md bg-primary text-primary-foreground text-xs font-semibold px-3 py-2">
            View deal
          </span>
        </div>
      </div>
    </Link>
  );
}
