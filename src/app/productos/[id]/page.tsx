import { notFound } from "next/navigation";
import {
  getProductByIdServer,
  getCategoryBySlugServer,
} from "@/lib/firebase/products-server";
import { toProductDTO, toCategoryDTO } from "@/lib/firebase/product-dto";
import { getProductById } from "@/lib/firebase/products";
import { getCategoryBySlug } from "@/lib/firebase/categories";
import ProductDetailClient from "./ProductDetailClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  let product = await getProductByIdServer(id).catch(() => null);
  if (!product) {
    product = await getProductById(id).catch(() => null);
  }
  if (!product) notFound();

  let category = product.category
    ? await getCategoryBySlugServer(product.category).catch(() => null)
    : null;
  if (!category && product.category) {
    category = await getCategoryBySlug(product.category).catch(() => null);
  }

  return (
    <ProductDetailClient
      productDto={toProductDTO(product)}
      categoryDto={category ? toCategoryDTO(category) : null}
    />
  );
}
