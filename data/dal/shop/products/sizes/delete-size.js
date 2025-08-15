"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { sizes as cache_key_sizes, products as cache_key_products } from "@/cache_keys";

const deleteSize = async (code) => {
  try {
    const exists = await query(`SELECT * FROM shop_sizes WHERE code = $1`, [code]);
    if (exists.rowCount === 0) {
      throw new Error("Size doesn't exist");
    }

    // Check if the size has associated products
    const hasProducts = await query(`SELECT COUNT(*) FROM shop_product_sizes WHERE size_id = $1`, [code]);
    if (parseInt(hasProducts.rows[0].count) > 0) {
      throw new Error("Cannot delete size that has associated products");
    }

    // Delete the size
    const deleted = await query(`DELETE FROM shop_sizes WHERE code = $1 RETURNING *;`, [code]);
    if (deleted.rowCount === 0) {
      throw new Error("Failed to delete size");
    }

    revalidateTag(cache_key_sizes);
    revalidateTag(cache_key_products);
    return { ok: true, data: deleted.rows, error: null };
  } catch (error) {
    console.error(`[/data/dal/shop/products/sizes/delete-size.js] Error deleting size:`, error);
    return { ok: false, data: null, error: error.message };
  }
};

export default deleteSize;
