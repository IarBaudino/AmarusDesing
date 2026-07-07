import { revalidatePath } from "next/cache";

/**
 * Invalida páginas estáticas que listan productos tras cambios en el catálogo.
 * Es "best-effort": un fallo al revalidar NUNCA debe romper la operación que la
 * invoca (p. ej. borrar un producto). Por eso cada llamada va protegida.
 */
export function revalidateProductCatalog() {
  const targets: Array<{ path: string; type?: "layout" | "page" }> = [
    { path: "/" },
    { path: "/tienda-online" },
    { path: "/buscar" },
    { path: "/categorias", type: "layout" },
    { path: "/productos", type: "layout" },
  ];

  for (const { path, type } of targets) {
    try {
      if (type) {
        revalidatePath(path, type);
      } else {
        revalidatePath(path);
      }
    } catch (error) {
      console.warn(`revalidateProductCatalog: no se pudo revalidar ${path}`, error);
    }
  }
}
