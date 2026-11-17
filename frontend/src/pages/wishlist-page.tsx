import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { ProductCard } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/skeleton";

export function WishlistPage() {
  const { items, isLoading } = useWishlist();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="type-heading-xl text-text-primary mb-6">Your wishlist</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="aspect-[4/3] w-full" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Heart size={32} className="text-text-muted" />
          <p className="type-title text-text-primary">Your wishlist is empty</p>
          <p className="type-body-small text-text-secondary">
            Tap the heart icon on any product to save it for later.
          </p>
        </div>
      )}
    </div>
  );
}
