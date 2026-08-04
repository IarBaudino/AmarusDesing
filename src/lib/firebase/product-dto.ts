import type { Product, Category } from "@/types";

/** Producto serializable para Client Components (sin Date). */
export type ProductDTO = Omit<Product, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type CategoryDTO = Omit<Category, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export function toProductDTO(product: Product): ProductDTO {
  return {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function fromProductDTO(dto: ProductDTO): Product {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

export function toCategoryDTO(category: Category): CategoryDTO {
  return {
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function fromCategoryDTO(dto: CategoryDTO): Category {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}
