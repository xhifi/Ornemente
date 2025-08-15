"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { types as cache_key_types } from "@/cache_keys";

const createProductType = async (name, id = null) => {
  try {
    // If id is provided, update the existing type
    if (id) {
      // Check if the type with this ID exists
      const typeExists = await query(`SELECT * FROM shop_types WHERE id = $1`, [id]);

      if (typeExists.rowCount === 0) {
        throw new Error("Type not found");
      }

      // Check if the new name already exists (but not for this type)
      const nameExists = await query(`SELECT * FROM shop_types WHERE name = $1 AND id != $2 ORDER BY created_at DESC`, [name, id]);

      if (nameExists.rowCount > 0) {
        throw new Error("Another type with this name already exists");
      }

      // Update the type
      const updated = await query(
        `UPDATE shop_types 
         SET name = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [name, id]
      );

      if (updated.rowCount === 0) {
        throw new Error("Failed to update type");
      }

      revalidateTag(cache_key_types);
      return { ok: true, data: updated.rows, error: null };
    }
    // If no id is provided, create a new type
    else {
      // Check if a type with this name already exists
      const exists = await query(`SELECT * FROM shop_types WHERE name = $1`, [name]);

      if (exists.rowCount > 0) {
        throw new Error("Type already exists");
      }

      // Create a new type
      const created = await query(`INSERT INTO shop_types (name) VALUES ($1) RETURNING *`, [name]);

      if (created.rowCount === 0) {
        throw new Error("Failed to create type");
      }

      revalidateTag(cache_key_types);
      return { ok: true, data: created.rows, error: null };
    }
  } catch (error) {
    console.error(`[/data/dal/shop/types/create-product-type.js] Error processing product type:`, error);
    return { ok: false, data: null, error: error.message };
  }
};

export default createProductType;
