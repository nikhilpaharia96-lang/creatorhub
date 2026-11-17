import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { adminCustomerApi } from "@/lib/api/admin-api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminCustomersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: adminCustomerApi.list,
  });

  const filtered = data?.filter(
    (customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-heading-xl text-text-primary">Customers</h1>

      <div className="max-w-sm">
        <Input
          placeholder="Search customers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search customers"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="type-body text-status-error-text">Couldn't load customers.</p>
      ) : filtered && filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((customer) => (
            <Card key={customer.id} padding="md" className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="type-title text-text-primary truncate">{customer.name}</p>
                <p className="type-caption text-text-secondary truncate">{customer.email}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="neutral" size="sm">
                  {customer._count.orders} order{customer._count.orders !== 1 ? "s" : ""}
                </Badge>
                <p className="type-caption text-text-muted">
                  Joined{" "}
                  {new Date(customer.createdAt).toLocaleDateString("en-IN", {
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
          <Users size={32} className="text-text-muted" />
          <p className="type-title text-text-primary">No customers found</p>
        </div>
      )}
    </div>
  );
}
