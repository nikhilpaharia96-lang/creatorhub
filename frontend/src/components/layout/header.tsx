import { Link } from "react-router-dom";
import { ShoppingCart, User as UserIcon, LogOut, Heart, ShieldCheck } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();

  return (
    <header className="sticky top-0 z-sticky bg-surface-base border-b border-border-default">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="type-heading-md text-text-primary shrink-0">
          CreatorHub
        </Link>

        <nav className="hidden md:flex items-center gap-6 flex-1">
          <Link to="/" className="type-body-small text-text-secondary hover:text-text-primary motion-feedback">
            Browse
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.role === "ADMIN" ? (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" leadingIcon={<ShieldCheck size={16} />}>
                    Admin
                  </Button>
                </Link>
              ) : null}
              <Link to="/wishlist">
                <Button variant="ghost" size="sm" isIconOnly aria-label="View wishlist">
                  <Heart size={20} />
                </Button>
              </Link>
              <Link to="/library">
                <Button variant="ghost" size="sm">
                  Library
                </Button>
              </Link>
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="sm" isIconOnly aria-label="View cart">
                  <ShoppingCart size={20} />
                </Button>
                {items.length > 0 ? (
                  <Badge
                    variant="brand"
                    size="sm"
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1"
                  >
                    {items.length}
                  </Badge>
                ) : null}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                aria-label="Log out"
                onClick={() => logout()}
              >
                <LogOut size={20} />
              </Button>
            </>
          ) : (
            <>
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="sm" isIconOnly aria-label="View cart">
                  <ShoppingCart size={20} />
                </Button>
                {items.length > 0 ? (
                  <Badge
                    variant="brand"
                    size="sm"
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1"
                  >
                    {items.length}
                  </Badge>
                ) : null}
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="sm" leadingIcon={<UserIcon size={16} />}>
                  Sign in
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
