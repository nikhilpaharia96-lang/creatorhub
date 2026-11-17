import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, PackageOpen, AlertCircle } from "lucide-react";
import { downloadApi } from "@/lib/api/catalog-api";
import { ApiRequestError } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function LibraryPage() {
  const { showToast } = useToast();

  const { data: entries, isLoading, isError } = useQuery({
    queryKey: ["library"],
    queryFn: downloadApi.library,
  });

  const downloadMutation = useMutation({
    mutationFn: downloadApi.getDownloadUrl,
    onSuccess: (result) => {
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    },
    onError: (err) => {
      showToast({
        variant: "error",
        title: "Download failed",
        description: err instanceof ApiRequestError ? err.message : "Please try again.",
      });
    },
  });

  return (
    <div className="max-w-[1024px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="type-heading-xl text-text-primary mb-6">Your library</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertCircle size={32} className="text-status-error-icon" />
          <p className="type-title text-text-primary">Couldn't load your library</p>
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Card
              key={entry.productId}
              padding="md"
              className="flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <img
                src={entry.product.thumbnailUrl}
                alt=""
                className="w-full sm:w-20 h-32 sm:h-20 rounded-surface-tight object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="type-title text-text-primary truncate">{entry.product.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {entry.isExpired ? (
                    <Badge variant="error" size="sm">
                      Access expired
                    </Badge>
                  ) : entry.downloadsRemaining === 0 ? (
                    <Badge variant="warning" size="sm">
                      Download limit reached
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm">
                      {entry.downloadsRemaining} download{entry.downloadsRemaining !== 1 ? "s" : ""}{" "}
                      remaining
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="secondary"
                leadingIcon={<Download size={18} />}
                disabled={entry.isExpired || entry.downloadsRemaining === 0}
                isLoading={
                  downloadMutation.isPending && downloadMutation.variables === entry.productId
                }
                onClick={() => downloadMutation.mutate(entry.productId)}
              >
                Download
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <PackageOpen size={32} className="text-text-muted" />
          <p className="type-title text-text-primary">No purchases yet</p>
          <p className="type-body-small text-text-secondary">
            Products you buy will show up here for instant download.
          </p>
        </div>
      )}
    </div>
  );
}
