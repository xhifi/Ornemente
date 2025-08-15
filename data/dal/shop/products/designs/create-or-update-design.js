"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { designs as cache_key_designs, products as cache_key_products } from "@/cache_keys";

const createOrUpdateDesign = async (formData) => {
  try {
    const id = formData.get("id");
    const name = formData.get("name");

    if (!name) {
      throw new Error("Design name is required");
    }

    // If id is provided, update the existing design
    if (id) {
      // Check if the design with this ID exists
      const designExists = await query(`SELECT * FROM shop_designs WHERE id = $1`, [id]);

      if (designExists.rowCount === 0) {
        throw new Error("Design not found");
      }

      // Check if the new name already exists (but not for this design)
      const nameExists = await query(`SELECT * FROM shop_designs WHERE name = $1 AND id != $2`, [name, id]);

      if (nameExists.rowCount > 0) {
        throw new Error("Another design with this name already exists");
      }

      // Update the design
      const updated = await query(
        `UPDATE shop_designs 
         SET name = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [name, id]
      );

      if (updated.rowCount === 0) {
        throw new Error("Failed to update design");
      }

      revalidateTag(cache_key_designs);
      revalidateTag(cache_key_products);
      return {
        ok: true,
        data: updated.rows[0],
        error: null,
      };
    }
    // If no id is provided, create a new design
    else {
      // Check if a design with this name already exists
      const exists = await query(`SELECT * FROM shop_designs WHERE name = $1`, [name]);

      if (exists.rowCount > 0) {
        throw new Error("Design already exists");
      }

      // Create a new design
      const created = await query(`INSERT INTO shop_designs (name) VALUES ($1) RETURNING *`, [name]);

      if (created.rowCount === 0) {
        throw new Error("Failed to create design");
      }

      revalidateTag(cache_key_designs);
      revalidateTag(cache_key_products);
      return {
        ok: true,
        data: created.rows[0],
        error: null,
      };
    }
  } catch (error) {
    console.error(`[/data/dal/shop/products/designs/create-or-update-design.js] Error processing design:`, error);
    return { ok: false, data: null, error: error.message };
  }
};

export default createOrUpdateDesign;
