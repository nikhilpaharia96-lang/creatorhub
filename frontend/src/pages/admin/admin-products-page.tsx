import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { adminProductApi } from "@/lib/api/admin-api";
import { ApiRequestError } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { formatPrice } from "@/lib/format";
import type { AdminProduct } from "@/types/api";
import type { CreateProductInput } from "@/types/product-forms";

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => adminProductApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: adminProductApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      setDialogOpen(false);
      showToast({ variant: "success", title: "Product created" });
    },
    onError: (err) => {
      showToast({
        variant: "error",
        title: "Couldn't create product",
        description: err instanceof ApiRequestError ? err.message : undefined,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateProductInput }) =>
      adminProductApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      setDialogOpen(false);
      setEditingProduct(null);
      showToast({ variant: "success", title: "Product updated" });
    },
    onError: (err) => {
      showToast({
        variant: "error",
        title: "Couldn't update product",
        description: err instanceof ApiRequestError ? err.message : undefined,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminProductApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      showToast({ variant: "success", title: "Product deleted" });
    },
    onError: (err) => {
      showToast({
        variant: "error",
        title: "Couldn't delete product",
        description: err instanceof ApiRequestError ? err.message : undefined,
      });
    },
  });

  const handleSubmit = async (values: CreateProductInput) => {
    if (editingProduct) {
      await updateMutation.mutateAsync({ id: editingProduct.id, input: values });
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="type-heading-xl text-text-primary">Products</h1>
        <Button
          leadingIcon={<Plus size={18} />}
          onClick={() => {
            setEditingProduct(null);
            setDialogOpen(true);
          }}
        >
          New product
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="type-body text-status-error-text">Couldn't load products.</p>
      ) : data && data.data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.data.map((product) => (
            <Card key={product.id} padding="md" className="flex items-center gap-4">
              <img
                src={product.thumbnailUrl}
                alt=""
                className="w-14 h-14 rounded-surface-tight object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="type-title text-text-primary truncate">{product.title}</p>
                <p className="type-caption text-text-secondary text-tabular">
                  {formatPrice(product.priceAmount, product.currency)} · {product.category}
                </p>
              </div>
              <Badge variant={product.isPublished ? "success" : "neutral"} size="sm">
                {product.isPublished ? "Published" : "Draft"}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label={`Edit ${product.title}`}
                  onClick={() => {
                    setEditingProduct(product);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label={`Delete ${product.title}`}
                  isLoading={deleteMutation.isPending && deleteMutation.variables === product.id}
                  onClick={() => {
                    if (window.confirm(`Delete "${product.title}"? This cannot be undone.`)) {
                      deleteMutation.mutate(product.id);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Package size={32} className="text-text-muted" />
          <p className="type-title text-text-primary">No products yet</p>
        </div>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        editingProduct={editingProduct}
      />
    </div>
  );
}
