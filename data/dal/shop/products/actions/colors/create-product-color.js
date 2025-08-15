"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { colors as cache_key_colors } from "@/cache_keys";

const createProductColor = async ({ id, name, hex }) => {
  try {
    // If id is provided, update the existing color
    if (id) {
      // Check if the color with this ID exists
      const colorExists = await query(`SELECT * FROM shop_colors WHERE id = $1`, [id]);

      if (colorExists.rowCount === 0) {
        throw new Error("Color not found");
      }

      // Check if the new name already exists (but not for this color)
      const nameExists = await query(`SELECT * FROM shop_colors WHERE name = $1 AND id != $2`, [name, id]);

      if (nameExists.rowCount > 0) {
        throw new Error("Another color with this name already exists");
      }

      // Update the color
      const updated = await query(
        `UPDATE shop_colors 
         SET name = $1, hex = $2, updated_at = NOW() 
         WHERE id = $3 
         RETURNING *`,
        [name, hex, id]
      );

      if (updated.rowCount === 0) {
        throw new Error("Failed to update color");
      }

      revalidateTag(cache_key_colors);
      return { ok: true, data: updated.rows, error: null };
    }
    // If no id is provided, create a new color
    else {
      // Check if a color with this name already exists
      const exists = await query(`SELECT * FROM shop_colors WHERE name = $1`, [name]);

      if (exists.rowCount > 0) {
        throw new Error("Color already exists");
      }

      // Create a new color with the hex array
      const created = await query(
        `INSERT INTO shop_colors (name, hex) 
         VALUES ($1, $2) 
         RETURNING *`,
        [name, hex]
      );

      if (created.rowCount === 0) {
        throw new Error("Failed to create color");
      }

      revalidateTag(cache_key_colors);
      return { ok: true, data: created.rows, error: null };
    }
  } catch (error) {
    console.error(`[/data/dal/shop/products/actions/colors/create-product-color.js] Error processing product color:`, error);
    return { ok: false, data: null, error: error.message };
  }
};

export default createProductColor;
