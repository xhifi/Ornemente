"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { designs as cache_key_designs, products as cache_key_products } from "@/cache_keys";

const deleteDesign = async (id) => {
  try {
    const exists = await query(`SELECT * FROM shop_designs WHERE id = $1`, [id]);
    if (exists.rowCount === 0) {
      throw new Error("Design doesn't exist");
    }

    // Check if the design has associated products
    const hasProducts = await query(`SELECT COUNT(*) FROM shop_product_designs WHERE design_id = $1`, [id]);
    if (parseInt(hasProducts.rows[0].count) > 0) {
      throw new Error("Cannot delete design that has associated products");
    }

    // Delete the design
    const deleted = await query(`DELETE FROM shop_designs WHERE id = $1 RETURNING *;`, [id]);
    if (deleted.rowCount === 0) {
      throw new Error("Failed to delete design");
    }

    revalidateTag(cache_key_designs);
    revalidateTag(cache_key_products);
    return { ok: true, data: deleted.rows, error: null };
  } catch (error) {
    console.error(`[/data/dal/shop/products/designs/delete-design.js] Error deleting design:`, error);
    return { ok: false, data: null, error: error.message };
  }
};

export default deleteDesign;
