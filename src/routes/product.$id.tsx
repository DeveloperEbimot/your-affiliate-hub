import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight, MapPin, BedDouble, Bath, DoorOpen, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: string | null;
  amazon_url: string;
  category_id: string | null;
  listing_type: string | null;
  location: string | null;
  beds: number | null;
  rooms: number | null;
  bathrooms: number | null;
  amenities: string[] | null;
};

type ProductImage = {
  id: string;
  image_url: string;
  display_order: number;
};

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">Listing not found.</div>
  ),
});

function ProductPage() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (!data) { setLoading(false); return; }
      setProduct(data as Product);

      if (data.category_id) {
        const { data: cat } = await supabase
          .from("categories").select("name").eq("id", data.category_id).maybeSingle();
        setCategoryName(cat?.name ?? null);
      }

      const { data: imagesData } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("display_order", { ascending: true });

      setImages(imagesData ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="mx-auto max-w-5xl p-8"><div className="h-96 rounded-xl bg-muted animate-pulse" /></div>;
  if (!product) throw notFound();

  const displayImages = images.length > 0 ? images : (product.image_url ? [{ id: "main", image_url: product.image_url, display_order: 0 }] : []);
  const currentImage = displayImages[currentImageIndex];
  const goToPrevious = () => setCurrentImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  const goToNext = () => setCurrentImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));

  const specs = [
    product.rooms != null && { icon: DoorOpen, label: `${product.rooms} ${product.rooms === 1 ? "room" : "rooms"}` },
    product.beds != null && { icon: BedDouble, label: `${product.beds} ${product.beds === 1 ? "bed" : "beds"}` },
    product.bathrooms != null && { icon: Bath, label: `${product.bathrooms} ${product.bathrooms === 1 ? "bathroom" : "bathrooms"}` },
  ].filter(Boolean) as { icon: any; label: string }[];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <div className="mb-4">
        {categoryName && (
          <span className="text-xs uppercase tracking-wider text-primary font-semibold">{categoryName}</span>
        )}
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">{product.name}</h1>
        {product.location && (
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {product.location}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted relative">
            {currentImage ? (
              <img src={currentImage.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">No image</div>
            )}

            {displayImages.length > 1 && (
              <>
                <button onClick={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full" aria-label="Previous image">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full" aria-label="Next image">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                  {currentImageIndex + 1} / {displayImages.length}
                </div>
              </>
            )}
          </div>

          {displayImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {displayImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition ${
                    idx === currentImageIndex ? "border-primary" : "border-border"
                  }`}
                >
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {specs.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {specs.map((s, i) => (
                <div key={i} className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm">
                  <s.icon className="h-4 w-4 text-primary" /> {s.label}
                </div>
              ))}
            </div>
          )}

          {product.description && (
            <div>
              <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">About</h2>
              <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.amenities && product.amenities.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">What's included</h2>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {product.amenities.map((a, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Booking card */}
          <div className="mt-6 rounded-xl border-2 border-primary/20 bg-secondary/30 p-4">
            {product.price && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground">Starting from</div>
                <div className="text-3xl font-bold text-primary">{product.price}</div>
              </div>
            )}
            <a
              href={product.amazon_url}
              target="_blank"
              rel="noopener sponsored"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90"
            >
              Book Now <ExternalLink className="h-4 w-4" />
            </a>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              You'll be redirected to our booking partner to complete your reservation securely.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
