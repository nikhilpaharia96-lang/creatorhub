import { useQuery } from "@tanstack/react-query";
import { IndianRupee, ShoppingBag, Users, Package } from "lucide-react";
import { adminAnalyticsApi } from "@/lib/api/admin-api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
}) {
  return (
    <Card padding="lg" className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-interactive bg-accent-subtle flex items-center justify-center shrink-0">
        <Icon size={20} className="text-interactive-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="type-caption text-text-secondary">{label}</p>
        <p className="type-heading-md text-text-primary text-tabular">{value}</p>
      </div>
    </Card>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: adminAnalyticsApi.summary,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="type-body text-status-error-text">Couldn't load analytics.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-heading-xl text-text-primary">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Total revenue" value={formatPrice(data.totalRevenue)} />
        <StatCard icon={ShoppingBag} label="Paid orders" value={String(data.paidOrderCount)} />
        <StatCard icon={Users} label="Customers" value={String(data.customerCount)} />
        <StatCard icon={Package} label="Published products" value={String(data.productCount)} />
      </div>

      <Card padding="lg">
        <h2 className="type-title text-text-primary mb-4">Top products</h2>
        {data.topProducts.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.topProducts.map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between type-body-small">
                <span className="text-text-secondary">
                  {index + 1}. {product.title}
                </span>
                <span className="text-text-primary text-tabular">{product.unitsSold} sold</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="type-body-small text-text-secondary">No sales data yet.</p>
        )}
      </Card>
    </div>
  );
}
