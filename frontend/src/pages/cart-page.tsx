import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/providers/cart-provider";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

export function CartPage() {
  const { items, removeItem, totalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-16 flex flex-col items-center text-center gap-3">
        <ShoppingCart size={32} className="text-text-muted" />
        <p className="type-title text-text-primary">Your cart is empty</p>
        <p className="type-body-small text-text-secondary">
          Browse the catalog to find something you'll love.
        </p>
        <Link to="/">
          <Button variant="secondary" className="mt-2">
            Browse products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[768px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="type-heading-xl text-text-primary mb-6">Your cart</h1>

      <div className="flex flex-col gap-3 mb-6">
        {items.map((item) => (
          <Card key={item.id} padding="md" className="flex items-center gap-4">
            <img
              src={item.thumbnailUrl}
              alt=""
              className="w-16 h-16 rounded-surface-tight object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="type-title text-text-primary truncate">{item.title}</p>
              <p className="type-body-small text-text-secondary text-tabular">
                {formatPrice(item.priceAmount, item.currency)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              aria-label={`Remove ${item.title} from cart`}
              onClick={() => removeItem(item.id)}
            >
              <Trash2 size={18} />
            </Button>
          </Card>
        ))}
      </div>

      <Card padding="md" className="flex items-center justify-between">
        <span className="type-title text-text-primary">Total</span>
        <span className="type-heading-md text-text-primary text-tabular">
          {formatPrice(totalAmount)}
        </span>
      </Card>

      <Button size="lg" fullWidth className="mt-6" onClick={handleCheckout}>
        Proceed to checkout
      </Button>
    </div>
  );
}
