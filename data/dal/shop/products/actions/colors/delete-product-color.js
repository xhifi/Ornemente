"use server";

import { revalidateTag } from "next/cache";
import { colors as cache_key_colors, products as cache_key_products } from "@/cache_keys";
import { query } from "@/lib/db";
const deleteProductColor = async (id) => {
  console.log(id);
  try {
    const exists = await query(`SELECT * FROM shop_colors WHERE id = $1`, [id]);
    if (exists.rowCount === 0) {
      throw new Error("Color doesn't exist");
    }
    const deleted = await query(`DELETE FROM shop_colors WHERE id = $1 RETURNING *;`, [id]);
    if (deleted.rowCount === 0) {
      throw new Error("Failed to delete color");
    }
    revalidateTag(cache_key_colors);
    revalidateTag(cache_key_products);
    return { ok: true, data: deleted.rows, error: null };
  } catch (error) {
    console.error(`[/data/dal/shop/products/delete-color.js] Error deleting product Color:`, error);
    return { ok: false, data: null, error: error.message };
  }
};

export default deleteProductColor;
