import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { useAuth } from "@/providers/auth-provider";
import type { Product } from "@/types/api";

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { isWishlisted, add, remove, isMutating } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (wishlisted) remove(product.id);
    else add(product.id);
  };

  return (
    <Link to={`/products/${product.slug}`} className="block focus-ring rounded-surface-soft">
      <Card padding="none" isInteractive className="overflow-hidden h-full flex flex-col">
        <div className="aspect-[4/3] bg-surface-subtle overflow-hidden relative">
          <img
            src={product.thumbnailUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {user ? (
            <Button
              variant="secondary"
              size="sm"
              isIconOnly
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="absolute top-2 right-2 bg-surface-base/90 backdrop-blur-sm"
              disabled={isMutating}
              onClick={handleToggleWishlist}
            >
              <Heart size={16} className={wishlisted ? "fill-status-error-icon text-status-error-icon" : ""} />
            </Button>
          ) : null}
        </div>
        <CardContent className="p-4 flex flex-col gap-2 flex-1">
          <Badge variant="neutral" size="sm" className="self-start">
            {product.category}
          </Badge>
          <h3 className="type-title text-text-primary line-clamp-2">{product.title}</h3>
          <p className="type-body-small text-text-secondary line-clamp-2 flex-1">
            {product.description}
          </p>
          <p className="type-title text-text-primary text-tabular mt-1">
            {formatPrice(product.priceAmount, product.currency)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
