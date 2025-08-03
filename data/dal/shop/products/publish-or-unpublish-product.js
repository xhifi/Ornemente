"use server";

import getProductById from "./get-product-by-id";
import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";

const publishOrUnpublishProduct = async (productId, action) => {
  try {
    // Validate action
    if (action !== "publish" && action !== "unpublish") {
      throw new Error("Invalid action. Use 'publish' or 'unpublish'.");
    }

    // Find the product
    const product = await getProductById(productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    // Update the product's published status
    await query`
            UPDATE products
            SET published = ${action === "publish"}
            WHERE id = ${productId}
        `;

    // Revalidate the product's cache
    revalidateTag(`product:${productId}`);

    return product;
  } catch (error) {
    console.error("Error publishing/unpublishing product:", error);
    throw new Error("Failed to publish/unpublish product.");
  }
};
export default publishOrUnpublishProduct;
