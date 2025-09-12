"use server";

import getProductById from "./get-product-by-id";
import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { product as cache_key_product, products as cache_key_products } from "@/cache_keys";
import { hasPermission } from "@/lib/authorization";

const publishOrUnpublishProduct = async (productId, action = true) => {
  try {
    // Publishing/unpublishing requires update permission on products
    if (!(await hasPermission("update", "products"))) {
      throw new Error("You do not have permission to publish/unpublish products");
    }

    if (!productId) {
      throw new Error("Product ID is required");
    }
    const product = await getProductById(productId);
    console.log(product);
    if (!product || !product.success) {
      throw new Error("Product not found or invalid ID");
    }
    const status = action ? "published" : "draft";
    const result = await query(
      `
      UPDATE shop_products
      SET publish_status = $1
      WHERE id = $2
      RETURNING id;
    `,
      [status, productId]
    );
    if (result.rowCount === 0) {
      throw new Error("Failed to update product status");
    }
    revalidateTag(cache_key_product(productId));
    revalidateTag(cache_key_products);
    return { success: true, data: { id: productId, status }, error: null };
  } catch (error) {
    console.error("Error publishing/unpublishing product:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

export default publishOrUnpublishProduct;
