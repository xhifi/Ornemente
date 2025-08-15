"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { brands as cache_key_brands, products as cache_key_products } from "@/cache_keys";

const deleteBrand = async (id) => {
  try {
    const exists = await query(`SELECT * FROM shop_brands WHERE id = $1`, [id]);
    if (exists.rowCount === 0) {
      throw new Error("Brand doesn't exist");
    }

    // Check if the brand has associated products
    const hasProducts = await query(`SELECT COUNT(*) FROM shop_products WHERE brand = $1`, [id]);
    if (parseInt(hasProducts.rows[0].count) > 0) {
      throw new Error("Cannot delete brand that has associated products");
    }

    // Delete brand images first (if any)
    await query(`DELETE FROM shop_images WHERE brand_id = $1`, [id]);

    // Then delete the brand
    const deleted = await query(`DELETE FROM shop_brands WHERE id = $1 RETURNING *;`, [id]);
    if (deleted.rowCount === 0) {
      throw new Error("Failed to delete brand");
    }

    revalidateTag(cache_key_brands);
    revalidateTag(cache_key_products);
    return { ok: true, data: deleted.rows, error: null };
  } catch (error) {
    console.error(`[/data/dal/shop/products/brands/delete-brand.js] Error deleting brand:`, error);
    return { ok: false, data: null, error: error.message };
  }
};

export default deleteBrand;
