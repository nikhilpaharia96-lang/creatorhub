import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Check, AlertCircle, FileArchive } from "lucide-react";
import { productApi } from "@/lib/api/catalog-api";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useCart } from "@/providers/cart-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, isInCart } = useCart();
  const { showToast } = useToast();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productApi.getBySlug(slug!),
    enabled: Boolean(slug),
  });

  useDocumentTitle(product?.title);

  if (isLoading) {
    return (
      <div className="max-w-[1024px] mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton variant="rectangular" className="aspect-[4/3] w-full" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-1/3 mt-4" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-[1024px] mx-auto px-4 sm:px-6 py-16 flex flex-col items-center text-center gap-3">
        <AlertCircle size={32} className="text-status-error-icon" />
        <p className="type-title text-text-primary">Product not found</p>
        <Button variant="secondary" onClick={() => navigate("/")}>
          Back to browsing
        </Button>
      </div>
    );
  }

  const alreadyInCart = isInCart(product.id);

  const handleAddToCart = () => {
    addItem(product);
    showToast({
      variant: "success",
      title: "Added to cart",
      description: product.title,
    });
  };

  return (
    <div className="max-w-[1024px] mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="aspect-[4/3] bg-surface-subtle rounded-surface-soft overflow-hidden">
        <img src={product.thumbnailUrl} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="flex flex-col gap-4">
        <Badge variant="neutral" size="sm" className="self-start">
          {product.category}
        </Badge>
        <h1 className="type-display-page text-text-primary">{product.title}</h1>
        <p className="type-body text-text-secondary whitespace-pre-line">
          {product.description}
        </p>

        <div className="flex items-center gap-2 type-body-small text-text-secondary">
          <FileArchive size={16} aria-hidden="true" />
          <span>{formatFileSize(product.fileSizeBytes)} download</span>
        </div>

        <p className="type-heading-lg text-text-primary text-tabular">
          {formatPrice(product.priceAmount, product.currency)}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          {alreadyInCart ? (
            <Button size="lg" variant="secondary" leadingIcon={<Check size={20} />} disabled>
              In cart
            </Button>
          ) : (
            <Button size="lg" leadingIcon={<ShoppingCart size={20} />} onClick={handleAddToCart}>
              Add to cart
            </Button>
          )}
          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              if (!alreadyInCart) addItem(product);
              navigate("/checkout");
            }}
          >
            Buy now
          </Button>
        </div>
      </div>
    </div>
  );
}
