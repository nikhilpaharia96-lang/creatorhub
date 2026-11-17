import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AdminProduct } from "@/types/api";
import type { CreateProductInput } from "@/types/product-forms";

const productFormSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  priceAmount: z.coerce.number().int().min(0, "Price cannot be negative"),
  category: z.string().min(1, "Category is required"),
  thumbnailUrl: z.string().url("Enter a valid URL"),
  fileStorageKey: z.string().min(1, "File storage key is required"),
  fileSizeBytes: z.coerce.number().int().min(1, "File size is required"),
  downloadLimit: z.coerce.number().int().min(1).default(5),
  downloadExpiryDays: z.coerce.number().int().min(1).default(365),
  isPublished: z.boolean().default(false),
});

type ProductFormInput = z.input<typeof productFormSchema>;
type ProductFormOutput = z.output<typeof productFormSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateProductInput) => Promise<void>;
  isSubmitting: boolean;
  editingProduct?: AdminProduct | null;
}

export function ProductFormDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  editingProduct,
}: ProductFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormOutput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      downloadLimit: 5,
      downloadExpiryDays: 365,
      isPublished: false,
    },
  });

  useEffect(() => {
    if (editingProduct) {
      reset({
        slug: editingProduct.slug,
        title: editingProduct.title,
        description: editingProduct.description,
        priceAmount: editingProduct.priceAmount,
        category: editingProduct.category,
        thumbnailUrl: editingProduct.thumbnailUrl,
        fileStorageKey: editingProduct.fileStorageKey,
        fileSizeBytes: editingProduct.fileSizeBytes,
        downloadLimit: editingProduct.downloadLimit,
        downloadExpiryDays: editingProduct.downloadExpiryDays,
        isPublished: editingProduct.isPublished,
      });
    } else if (open) {
      reset({
        slug: "",
        title: "",
        description: "",
        priceAmount: 0,
        category: "",
        thumbnailUrl: "",
        fileStorageKey: "",
        fileSizeBytes: 0,
        downloadLimit: 5,
        downloadExpiryDays: 365,
        isPublished: false,
      });
    }
  }, [editingProduct, open, reset]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{editingProduct ? "Edit product" : "New product"}</DialogTitle>
        <DialogCloseButton />
      </DialogHeader>

      <form
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
        })}
        className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1"
      >
        <Input label="Title" errorText={errors.title?.message} {...register("title")} />
        <Input
          label="Slug"
          helperText={!errors.slug ? "Used in the product URL" : undefined}
          errorText={errors.slug?.message}
          {...register("slug")}
        />
        <Input label="Category" errorText={errors.category?.message} {...register("category")} />
        <Input
          label="Description"
          errorText={errors.description?.message}
          {...register("description")}
        />
        <Input
          label="Price (in paise)"
          type="number"
          helperText={!errors.priceAmount ? "e.g. 149900 for ₹1,499" : undefined}
          errorText={errors.priceAmount?.message}
          {...register("priceAmount")}
        />
        <Input
          label="Thumbnail URL"
          errorText={errors.thumbnailUrl?.message}
          {...register("thumbnailUrl")}
        />
        <Input
          label="File storage key"
          helperText={!errors.fileStorageKey ? "R2/S3 object key — never shown to customers" : undefined}
          errorText={errors.fileStorageKey?.message}
          {...register("fileStorageKey")}
        />
        <Input
          label="File size (bytes)"
          type="number"
          errorText={errors.fileSizeBytes?.message}
          {...register("fileSizeBytes")}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Download limit" type="number" {...register("downloadLimit")} />
          <Input label="Access expiry (days)" type="number" {...register("downloadExpiryDays")} />
        </div>
        <label className="flex items-center gap-2 type-body-small text-text-primary">
          <input type="checkbox" className="focus-ring" {...register("isPublished")} />
          Published (visible to customers)
        </label>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {editingProduct ? "Save changes" : "Create product"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
