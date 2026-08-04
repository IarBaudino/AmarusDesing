import "server-only";
import { getFirestore } from "firebase-admin/firestore";
import {
  getFirebaseAdminApp,
  hasFirebaseAdminCredentials,
} from "@/lib/firebase-admin-server";
import type { Product, ProductCategory, Category } from "@/types";
import {
  normalizePurchaseOptionsFromFirestore,
  normalizeVariantStockFromFirestore,
} from "@/lib/product-purchase-options";

function convertTimestamp(timestamp: unknown): Date {
  if (
    timestamp &&
    typeof timestamp === "object" &&
    "toDate" in timestamp &&
    typeof (timestamp as { toDate: () => Date }).toDate === "function"
  ) {
    return (timestamp as { toDate: () => Date }).toDate();
  }
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string" || typeof timestamp === "number") {
    return new Date(timestamp);
  }
  return new Date();
}

function firestoreToProduct(data: Record<string, unknown>, id: string): Product {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    price: Number(data.price ?? 0),
    originalPrice:
      typeof data.originalPrice === "number" ? data.originalPrice : undefined,
    category: data.category as ProductCategory,
    subcategory:
      typeof data.subcategory === "string" ? data.subcategory : undefined,
    images: Array.isArray(data.images) ? (data.images as Product["images"]) : [],
    inStock: data.inStock !== false,
    stock: typeof data.stock === "number" ? data.stock : 0,
    featured: Boolean(data.featured),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    materials: Array.isArray(data.materials)
      ? (data.materials as string[])
      : undefined,
    dimensions:
      typeof data.dimensions === "string" ? data.dimensions : undefined,
    weight: typeof data.weight === "number" ? data.weight : undefined,
    attributes:
      data.attributes && typeof data.attributes === "object"
        ? (data.attributes as Record<string, string>)
        : undefined,
    purchaseOptions: normalizePurchaseOptionsFromFirestore(data.purchaseOptions),
    variantStock: normalizeVariantStockFromFirestore(data.variantStock),
    artisan:
      data.artisan && typeof data.artisan === "object"
        ? (data.artisan as Product["artisan"])
        : undefined,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    seo: (data.seo as Product["seo"]) || {
      title: String(data.name ?? ""),
      description: String(data.description ?? ""),
      keywords: [],
    },
  };
}

function firestoreToCategory(
  data: Record<string, unknown>,
  id: string
): Category {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    description: String(data.description ?? ""),
    image: typeof data.image === "string" ? data.image : undefined,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
    icon: typeof data.icon === "string" ? data.icon : undefined,
    order: typeof data.order === "number" ? data.order : 0,
    active: data.active !== false,
    featured: Boolean(data.featured),
    parentId: typeof data.parentId === "string" ? data.parentId : undefined,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
}

export async function getProductByIdServer(
  id: string
): Promise<Product | null> {
  if (!hasFirebaseAdminCredentials()) {
    return null;
  }
  const db = getFirestore(getFirebaseAdminApp());
  const snap = await db.collection("products").doc(id).get();
  if (!snap.exists) return null;
  return firestoreToProduct(snap.data() as Record<string, unknown>, snap.id);
}

export async function getCategoryBySlugServer(
  slug: string
): Promise<Category | null> {
  if (!hasFirebaseAdminCredentials()) {
    return null;
  }
  const db = getFirestore(getFirebaseAdminApp());
  const snap = await db
    .collection("categories")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return firestoreToCategory(doc.data() as Record<string, unknown>, doc.id);
}
