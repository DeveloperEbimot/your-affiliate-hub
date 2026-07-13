import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: string | null;
  amazon_url: string;
  category_id: string | null;
};

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">Product not found.</div>
  ),
});

function ProductPage() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (!data) { setLoading(false); return; }
      setProduct(data);
      if (data.category_id) {
        const { data: cat } = await supabase
          .from("categories").select("name").eq("id", data.category_id).maybeSingle();
        setCategoryName(cat?.name ?? null);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="mx-auto max-w-4xl p-8"><div className="h-96 rounded-xl bg-muted animate-pulse" /></div>;
  if (!product) throw notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">No image</div>
          )}
        </div>

        <div className="flex flex-col">
          {categoryName && (
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{categoryName}</span>
          )}
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{product.name}</h1>
          {product.price && (
            <div className="mt-4 text-2xl font-bold text-accent-foreground">{product.price}</div>
          )}
          {product.description && (
            <p className="mt-6 text-muted-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
          )}

          <a
            href={product.amazon_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:opacity-90"
          >
            Buy on Amazon <ExternalLink className="h-4 w-4" />
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            As an Amazon Associate we earn from qualifying purchases.
          </p>
        </div>
      </div>
    </main>
  );
}
