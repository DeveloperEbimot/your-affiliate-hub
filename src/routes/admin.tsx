import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Upload, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

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
  beds: number | null;
  rooms: number | null;
  bathrooms: number | null;
  amenities: string[] | null;
};

type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
};

const emptyProduct = {
  name: "", description: "", image_url: "", price: "", amazon_url: "", category_id: "", featured: false,
  listing_type: "hotel", location: "", beds: "", rooms: "", bathrooms: "", amenities: "",
};


export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<typeof emptyProduct>(emptyProduct);
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const load = async () => {
    const [cats, prods] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
    ]);
    setCategories(cats.data ?? []);
    setProducts(prods.data ?? []);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const loadProductImages = async (productId: string) => {
    const { data } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("display_order", { ascending: true });
    setProductImages(data ?? []);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!user) return null;
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">You don't have admin access.</div>;

  const startEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      price: p.price ?? "",
      amazon_url: p.amazon_url,
      category_id: p.category_id ?? "",
      featured: p.featured,
    });
    loadProductImages(p.id);
    setShowForm(true);
  };

  const resetForm = () => { setEditing(null); setForm(emptyProduct); setProductImages([]); setShowForm(false); };

  const handleImageUpload = async (file: File) => {
    if (!file || !editing) return;

    setUploading(true);
    try {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        setUploading(false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        setUploading(false);
        return;
      }

      const filename = `${Date.now()}_${file.name}`;
      const filepath = `product-images/${filename}`;

      const { data, error: uploadError } = await supabase.storage
        .from("product_images")
        .upload(filepath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product_images")
        .getPublicUrl(filepath);

      const publicUrl = urlData.publicUrl;
      const maxOrder = productImages.length > 0 ? Math.max(...productImages.map(img => img.display_order)) : -1;

      const { error: insertError } = await supabase
        .from("product_images")
        .insert({ product_id: editing.id, image_url: publicUrl, display_order: maxOrder + 1 });

      if (insertError) throw insertError;

      await loadProductImages(editing.id);
      toast.success("Image added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageId: string) => {
    const { error } = await supabase.from("product_images").delete().eq("id", imageId);
    if (error) return toast.error(error.message);
    await loadProductImages(editing!.id);
    toast.success("Image removed");
  };

  const moveImage = async (imageId: string, direction: "up" | "down") => {
    const image = productImages.find(img => img.id === imageId);
    if (!image) return;

    const targetOrder = direction === "up" ? image.display_order - 1 : image.display_order + 1;
    const otherImage = productImages.find(img => img.display_order === targetOrder);

    if (!otherImage) return;

    await Promise.all([
      supabase.from("product_images").update({ display_order: targetOrder }).eq("id", imageId),
      supabase.from("product_images").update({ display_order: image.display_order }).eq("id", otherImage.id),
    ]);

    await loadProductImages(editing!.id);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const mainImage = productImages.length > 0 ? productImages[0].image_url : form.image_url;
    
    const payload = {
      name: form.name,
      description: form.description || null,
      image_url: mainImage || null,
      price: form.price || null,
      amazon_url: form.amazon_url,
      category_id: form.category_id || null,
      featured: form.featured,
    };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Product updated" : "Product added");
    resetForm();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await supabase.from("categories").insert({ name, slug });
    if (error) return toast.error(error.message);
    setNewCategory("");
    toast.success("Category added");
    load();
  };

  const removeCategory = async (id: string) => {
    if (!confirm("Delete this category? Products will be uncategorized.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage products and categories.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          <Plus className="h-4 w-4" /> New product
        </button>
      </div>

      {/* Categories */}
      <section className="mb-10 rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
              {c.name}
              <button onClick={() => removeCategory(c.id)} className="text-muted-foreground hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button onClick={addCategory} className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            Add
          </button>
        </div>
      </section>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={resetForm}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editing ? "Edit product" : "New product"}</h3>
              <button type="button" onClick={resetForm}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Name *">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
              </Field>
              <Field label="Buy link (your affiliate URL) *">
                <input required type="url" placeholder="https://..." value={form.amazon_url}
                  onChange={(e) => setForm({ ...form, amazon_url: e.target.value })} className={input} />
              </Field>

              {editing && (
                <Field label="Product Images">
                  <div className="space-y-2">
                    {productImages.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {productImages.map((img, idx) => (
                          <div key={img.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                            <img src={img.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                            <div className="flex-1 text-sm text-muted-foreground truncate">Image {idx + 1}</div>
                            <button
                              type="button"
                              onClick={() => moveImage(img.id, "up")}
                              disabled={idx === 0}
                              className="p-1 hover:bg-muted disabled:opacity-50"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(img.id, "down")}
                              disabled={idx === productImages.length - 1}
                              className="p-1 hover:bg-muted disabled:opacity-50"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="p-1 text-destructive hover:bg-muted"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-muted/50 px-4 py-6 cursor-pointer hover:bg-muted transition">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Click to add more images</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
                  </div>
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price">
                  <input placeholder="$29.99" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} />
                </Field>
                <Field label="Category">
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={input}>
                    <option value="">— None —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Description">
                <textarea rows={4} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} className={input} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                Featured
              </label>
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={resetForm} className="flex-1 rounded-md border border-border py-2 text-sm">Cancel</button>
              <button type="submit" className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground">
                {editing ? "Update" : "Add product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products list */}
      <section>
        <h2 className="font-semibold mb-4">Products ({products.length})</h2>
        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No products yet. Click "New product" to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-muted">
                  {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.price} · {categories.find((c) => c.id === p.category_id)?.name ?? "Uncategorized"}</div>
                </div>
                <button onClick={() => startEdit(p)} className="rounded-md p-2 hover:bg-muted" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(p.id)} className="rounded-md p-2 text-destructive hover:bg-muted" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
