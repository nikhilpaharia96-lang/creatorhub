import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, Trash2 } from "lucide-react";
import { adminCouponApi } from "@/lib/api/admin-api";
import { ApiRequestError } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";

const couponFormSchema = z.object({
  code: z
    .string()
    .min(3, "At least 3 characters")
    .max(32)
    .regex(/^[A-Z0-9_-]+$/, "Uppercase letters, numbers, hyphens, underscores only"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().int().min(1, "Must be at least 1"),
  maxRedemptions: z.coerce.number().int().min(1).optional().or(z.literal("")),
});

type CouponFormInput = z.input<typeof couponFormSchema>;
type CouponFormOutput = z.output<typeof couponFormSchema>;

export function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: adminCouponApi.list,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CouponFormInput, unknown, CouponFormOutput>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: { discountType: "PERCENTAGE" },
  });

  const createMutation = useMutation({
    mutationFn: adminCouponApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setDialogOpen(false);
      reset();
      showToast({ variant: "success", title: "Coupon created" });
    },
    onError: (err) => {
      showToast({
        variant: "error",
        title: "Couldn't create coupon",
        description: err instanceof ApiRequestError ? err.message : undefined,
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminCouponApi.setActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminCouponApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      showToast({ variant: "success", title: "Coupon deleted" });
    },
  });

  const onSubmit = (values: CouponFormOutput) => {
    createMutation.mutate({
      code: values.code,
      discountType: values.discountType,
      discountValue: values.discountValue,
      maxRedemptions: values.maxRedemptions === "" ? undefined : values.maxRedemptions,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="type-heading-xl text-text-primary">Coupons</h1>
        <Button leadingIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>
          New coupon
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="type-body text-status-error-text">Couldn't load coupons.</p>
      ) : data && data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.map((coupon) => {
            const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
            const isExhausted =
              coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions;

            return (
              <Card key={coupon.id} padding="md" className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-interactive bg-accent-subtle flex items-center justify-center shrink-0">
                  <Tag size={18} className="text-interactive-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="type-title text-text-primary text-tabular">{coupon.code}</p>
                  <p className="type-caption text-text-secondary">
                    {coupon.discountType === "PERCENTAGE"
                      ? `${coupon.discountValue}% off`
                      : `${formatPrice(coupon.discountValue)} off`}
                    {coupon.maxRedemptions
                      ? ` · ${coupon.redemptionCount}/${coupon.maxRedemptions} used`
                      : ` · ${coupon.redemptionCount} used`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isExpired ? (
                    <Badge variant="error" size="sm">Expired</Badge>
                  ) : isExhausted ? (
                    <Badge variant="warning" size="sm">Exhausted</Badge>
                  ) : (
                    <Badge variant={coupon.isActive ? "success" : "neutral"} size="sm">
                      {coupon.isActive ? "Active" : "Disabled"}
                    </Badge>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      toggleMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })
                    }
                    isLoading={toggleMutation.isPending && toggleMutation.variables?.id === coupon.id}
                  >
                    {coupon.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    aria-label={`Delete coupon ${coupon.code}`}
                    onClick={() => {
                      if (window.confirm(`Delete coupon "${coupon.code}"?`)) {
                        deleteMutation.mutate(coupon.id);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Tag size={32} className="text-text-muted" />
          <p className="type-title text-text-primary">No coupons yet</p>
        </div>
      )}

      {dialogOpen ? (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>New coupon</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Code"
              placeholder="SAVE20"
              errorText={errors.code?.message}
              {...register("code")}
            />
            <label className="type-label text-text-primary flex flex-col gap-1.5">
              Discount type
              <select
                className="h-11 px-4 rounded-interactive border border-border-default bg-surface-base type-body focus-ring"
                {...register("discountType")}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount (paise)</option>
              </select>
            </label>
            <Input
              label="Discount value"
              type="number"
              helperText={!errors.discountValue ? "e.g. 20 for 20%, or 10000 for ₹100 off" : undefined}
              errorText={errors.discountValue?.message}
              {...register("discountValue")}
            />
            <Input
              label="Max redemptions (optional)"
              type="number"
              helperText={!errors.maxRedemptions ? "Leave blank for unlimited" : undefined}
              errorText={errors.maxRedemptions?.message}
              {...register("maxRedemptions")}
            />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createMutation.isPending}>
                Create coupon
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
