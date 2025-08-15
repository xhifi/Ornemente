"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { sizes as cache_key_sizes, products as cache_key_products } from "@/cache_keys";

const createOrUpdateSize = async (formData) => {
  try {
    const code = formData.get("code");
    const label = formData.get("label");
    const oldCode = formData.get("oldCode"); // Used for updating existing code

    if (!code) {
      throw new Error("Size code is required");
    }

    if (!label) {
      throw new Error("Size label is required");
    }

    // If oldCode is provided, update the existing size
    if (oldCode) {
      // Check if the size with this code exists
      const sizeExists = await query(`SELECT * FROM shop_sizes WHERE code = $1`, [oldCode]);

      if (sizeExists.rowCount === 0) {
        throw new Error("Size not found");
      }

      // Check if the new code already exists (but not for this size)
      if (oldCode !== code) {
        const codeExists = await query(`SELECT * FROM shop_sizes WHERE code = $1 AND code != $2`, [code, oldCode]);
        if (codeExists.rowCount > 0) {
          throw new Error("Another size with this code already exists");
        }
      }

      // Update the size
      const updated = await query(
        `UPDATE shop_sizes 
         SET code = $1, label = $2, updated_at = NOW() 
         WHERE code = $3 
         RETURNING *`,
        [code, label, oldCode]
      );

      if (updated.rowCount === 0) {
        throw new Error("Failed to update size");
      }

      // If code has changed, update all related shop_product_sizes entries
      if (oldCode !== code) {
        await query(
          `UPDATE shop_product_sizes 
           SET size_id = $1
           WHERE size_id = $2`,
          [code, oldCode]
        );
      }

      revalidateTag(cache_key_sizes);
      revalidateTag(cache_key_products);
      return {
        ok: true,
        data: updated.rows[0],
        error: null,
      };
    }
    // If no oldCode is provided, create a new size
    else {
      // Check if a size with this code already exists
      const exists = await query(`SELECT * FROM shop_sizes WHERE code = $1`, [code]);

      if (exists.rowCount > 0) {
        throw new Error("Size already exists");
      }

      // Create a new size
      const created = await query(`INSERT INTO shop_sizes (code, label) VALUES ($1, $2) RETURNING *`, [code, label]);

      if (created.rowCount === 0) {
        throw new Error("Failed to create size");
      }

      revalidateTag(cache_key_sizes);
      revalidateTag(cache_key_products);
      return {
        ok: true,
        data: created.rows[0],
        error: null,
      };
    }
  } catch (error) {
    console.error(`[/data/dal/shop/products/sizes/create-or-update-size.js] Error processing size:`, error);
    return { ok: false, data: null, error: error.message };
  }
};

export default createOrUpdateSize;
