import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchX, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { productApi, type ProductListParams } from "@/lib/api/catalog-api";
import { api } from "@/lib/api/client";
import { useDocumentTitle } from "@/lib/use-document-title";
import { ProductCard } from "@/components/product/product-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SORT_OPTIONS: { value: NonNullable<ProductListParams["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const PAGE_SIZE = 24;

export function CatalogPage() {
  useDocumentTitle();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<NonNullable<ProductListParams["sort"]>>("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    const timeout = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timeout);
  };

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<string[]>("/api/products/categories"),
    staleTime: 5 * 60 * 1000,
  });

  // Prices entered in rupees by the user, converted to paise for the API
  // (backend stores/expects the smallest currency unit throughout).
  const minPricePaise = minPrice ? Math.round(Number(minPrice) * 100) : undefined;
  const maxPricePaise = maxPrice ? Math.round(Number(maxPrice) * 100) : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "products",
      { search: debouncedSearch, category, sort, minPricePaise, maxPricePaise, page },
    ],
    queryFn: () =>
      productApi.list({
        search: debouncedSearch || undefined,
        category,
        sort,
        minPrice: minPricePaise,
        maxPrice: maxPricePaise,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="type-display-page text-text-primary mb-2">Browse products</h1>
        <p className="type-body text-text-secondary">
          Templates, workflows, presets, and more — ready to download instantly.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search products"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Min ₹"
            type="number"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setPage(1);
            }}
            aria-label="Minimum price"
            className="w-24"
          />
          <Input
            placeholder="Max ₹"
            type="number"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setPage(1);
            }}
            aria-label="Maximum price"
            className="w-24"
          />
        </div>
        <label className="type-body-small text-text-primary flex items-center gap-2">
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as NonNullable<ProductListParams["sort"]>);
              setPage(1);
            }}
            className="h-11 px-4 rounded-interactive border border-border-default bg-surface-base type-body-small focus-ring"
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {categories && categories.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => {
              setCategory(undefined);
              setPage(1);
            }}
            className="focus-ring rounded-full"
          >
            <Badge variant={!category ? "brand" : "neutral"} size="md" className="cursor-pointer">
              All
            </Badge>
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                setPage(1);
              }}
              className="focus-ring rounded-full"
            >
              <Badge variant={category === cat ? "brand" : "neutral"} size="md" className="cursor-pointer">
                {cat}
              </Badge>
            </button>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton variant="rectangular" className="aspect-[4/3] w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertCircle size={32} className="text-status-error-icon" />
          <p className="type-title text-text-primary">Couldn't load products</p>
          <p className="type-body-small text-text-secondary">Please try refreshing the page.</p>
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 mt-10">
              <Button
                variant="secondary"
                size="sm"
                isIconOnly
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={18} />
              </Button>
              <span className="type-body-small text-text-secondary text-tabular">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                isIconOnly
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <SearchX size={32} className="text-text-muted" />
          <p className="type-title text-text-primary">No products found</p>
          <p className="type-body-small text-text-secondary">Try a different search term or filter.</p>
        </div>
      )}
    </div>
  );
}
