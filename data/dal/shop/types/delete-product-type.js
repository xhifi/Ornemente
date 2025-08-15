"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { types as cache_key_types, products as cache_key_products } from "@/cache_keys";

const deleteProductType = async (id) => {
  console.log(id);
  try {
    const exists = await query(`SELECT * FROM shop_types WHERE id = $1`, [id]);
    if (exists.rowCount === 0) {
      throw new Error("Type doesn't exist");
    }
    const deleted = await query(`DELETE FROM shop_types WHERE id = $1 RETURNING *;`, [id]);
    if (deleted.rowCount === 0) {
      throw new Error("Failed to delete type");
    }
    revalidateTag(cache_key_types);
    revalidateTag(cache_key_products);
    return { ok: true, data: deleted.rows, error: null };
  } catch (error) {
    console.error(`[/data/dal/shop/products/delete-type.js] Error deleting product Type:`, error);
    return { ok: false, data: null, error: error.message };
  }
};

export default deleteProductType;
