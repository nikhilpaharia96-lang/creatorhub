import { describe, it, expect } from "vitest";
import {
  productListQuerySchema,
  createProductSchema,
  updateProductSchema,
} from "./product-schemas";

describe("productListQuerySchema", () => {
  it("applies defaults when nothing is provided", () => {
    const result = productListQuerySchema.parse({});
    expect(result.sort).toBe("newest");
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("coerces string query params to numbers", () => {
    const result = productListQuerySchema.parse({ minPrice: "1000", page: "2" });
    expect(result.minPrice).toBe(1000);
    expect(result.page).toBe(2);
  });

  it("rejects a pageSize above the max of 50", () => {
    expect(() => productListQuerySchema.parse({ pageSize: "51" })).toThrow();
  });

  it("rejects an invalid sort value", () => {
    expect(() => productListQuerySchema.parse({ sort: "cheapest_first" })).toThrow();
  });

  it("accepts each valid sort value", () => {
    for (const sort of ["newest", "price_asc", "price_desc"]) {
      expect(() => productListQuerySchema.parse({ sort })).not.toThrow();
    }
  });

  it("rejects a negative minPrice", () => {
    expect(() => productListQuerySchema.parse({ minPrice: "-100" })).toThrow();
  });
});

describe("createProductSchema", () => {
  const validProduct = {
    slug: "my-product",
    title: "My Product",
    description: "A great product",
    priceAmount: 99900,
    category: "templates",
    thumbnailUrl: "https://example.com/image.jpg",
    fileStorageKey: "products/my-product.zip",
    fileSizeBytes: 1024,
  };

  it("accepts a fully valid product", () => {
    expect(() => createProductSchema.parse(validProduct)).not.toThrow();
  });

  it("applies default values for isPublished, downloadLimit, downloadExpiryDays", () => {
    const result = createProductSchema.parse(validProduct);
    expect(result.isPublished).toBe(false);
    expect(result.downloadLimit).toBe(5);
    expect(result.downloadExpiryDays).toBe(365);
  });

  it("rejects an uppercase slug", () => {
    expect(() => createProductSchema.parse({ ...validProduct, slug: "My-Product" })).toThrow();
  });

  it("rejects a slug with spaces or special characters", () => {
    expect(() => createProductSchema.parse({ ...validProduct, slug: "my product!" })).toThrow();
  });

  it("accepts a slug with hyphens and numbers", () => {
    expect(() =>
      createProductSchema.parse({ ...validProduct, slug: "product-v2-2026" })
    ).not.toThrow();
  });

  it("rejects a negative price", () => {
    expect(() => createProductSchema.parse({ ...validProduct, priceAmount: -100 })).toThrow();
  });

  it("rejects a non-integer price (fractional paise)", () => {
    expect(() => createProductSchema.parse({ ...validProduct, priceAmount: 99.5 })).toThrow();
  });

  it("rejects an invalid thumbnail URL", () => {
    expect(() =>
      createProductSchema.parse({ ...validProduct, thumbnailUrl: "not-a-url" })
    ).toThrow();
  });

  it("rejects an empty title", () => {
    expect(() => createProductSchema.parse({ ...validProduct, title: "" })).toThrow();
  });

  it("rejects a title over 200 characters", () => {
    expect(() =>
      createProductSchema.parse({ ...validProduct, title: "a".repeat(201) })
    ).toThrow();
  });
});

describe("updateProductSchema", () => {
  it("accepts a partial update with just one field", () => {
    const result = updateProductSchema.parse({ priceAmount: 149900 });
    expect(result.priceAmount).toBe(149900);
    expect(result.title).toBeUndefined();
  });

  it("accepts an empty object (no-op update)", () => {
    expect(() => updateProductSchema.parse({})).not.toThrow();
  });

  it("still validates field constraints when a field is present", () => {
    expect(() => updateProductSchema.parse({ slug: "Invalid Slug!" })).toThrow();
  });
});
