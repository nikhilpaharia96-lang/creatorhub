import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { adminOrderApi } from "@/lib/api/admin-api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import type { OrderStatus } from "@/types/api";

const STATUS_VARIANT: Record<OrderStatus, "neutral" | "success" | "error" | "warning"> = {
  PENDING: "neutral",
  PAID: "success",
  FAILED: "error",
  REFUNDED: "warning",
};

export function AdminOrdersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: adminOrderApi.list,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-heading-xl text-text-primary">Orders</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="type-body text-status-error-text">Couldn't load orders.</p>
      ) : data && data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.map((order) => (
            <Card key={order.id} padding="md" className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="type-title text-text-primary">{order.user.name}</p>
                  <Badge variant={STATUS_VARIANT[order.status]} size="sm">
                    {order.status}
                  </Badge>
                </div>
                <p className="type-caption text-text-secondary">{order.user.email}</p>
                <p className="type-caption text-text-muted mt-1">
                  {order.items.map((item) => item.product.title).join(", ")}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="type-title text-text-primary text-tabular">
                  {formatPrice(order.totalAmount, order.currency)}
                </p>
                {order.discountAmount > 0 ? (
                  <p className="type-caption text-status-success-text text-tabular">
                    -{formatPrice(order.discountAmount)} discount
                  </p>
                ) : null}
                <p className="type-caption text-text-muted">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <ShoppingBag size={32} className="text-text-muted" />
          <p className="type-title text-text-primary">No orders yet</p>
        </div>
      )}
    </div>
  );
}
