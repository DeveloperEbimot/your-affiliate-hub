import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
};

export const Route = createFileRoute("/")({
  component: Home,
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
      setProducts(prods.data ?? []);
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
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, activeCat]);

  return (
    <main className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-12 sm:py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3 text-accent" />
          Curated collection
        </div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Only the good stuff.
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Browse our hand-picked products across every category.
        </p>


        <div className="mt-8 mx-auto max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-border bg-card py-3 pl-10 pr-4 text-sm shadow-[var(--shadow-card)] focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 justify-center pb-8">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-16">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {products.length === 0
            ? "No products yet. Sign in as admin to add your first pick."
            : "No products match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-16">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
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
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5"
    >
      <div className="aspect-square overflow-hidden bg-muted">
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
      </div>
      <div className="flex flex-col flex-1 p-3">
        <h3 className="text-sm font-semibold line-clamp-2">{product.name}</h3>
        <div className="mt-auto pt-3 flex items-center justify-between">
          {product.price ? (
            <span className="text-sm font-bold">{product.price}</span>
          ) : <span />}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-foreground bg-accent/90 rounded-full px-2 py-1">
            View <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
