"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { brands as cache_key_brands, products as cache_key_products } from "@/cache_keys";
import saveBrandImage from "./save-brand-image";

const createOrUpdateBrand = async (formData) => {
  try {
    const id = formData.get("id");
    const name = formData.get("name");
    const imageFile = formData.get("image");

    if (!name) {
      throw new Error("Brand name is required");
    }

    // If id is provided, update the existing brand
    if (id) {
      // Check if the brand with this ID exists
      const brandExists = await query(`SELECT * FROM shop_brands WHERE id = $1`, [id]);

      if (brandExists.rowCount === 0) {
        throw new Error("Brand not found");
      }

      // Check if the new name already exists (but not for this brand)
      const nameExists = await query(`SELECT * FROM shop_brands WHERE name = $1 AND id != $2`, [name, id]);

      if (nameExists.rowCount > 0) {
        throw new Error("Another brand with this name already exists");
      }

      // Update the brand
      const updated = await query(
        `UPDATE shop_brands 
         SET name = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [name, id]
      );

      if (updated.rowCount === 0) {
        throw new Error("Failed to update brand");
      }

      // Handle image upload if provided
      let imageResult = null;
      if (imageFile && imageFile.size > 0) {
        try {
          imageResult = await saveBrandImage({
            brandId: id,
            file: imageFile,
          });
        } catch (imageError) {
          console.error("Error saving brand image:", imageError);
          // We still return success for the brand update even if image upload fails
        }
      }

      revalidateTag(cache_key_brands);
      revalidateTag(cache_key_products);
      return {
        ok: true,
        data: updated.rows[0],
        image: imageResult,
        error: null,
      };
    }
    // If no id is provided, create a new brand
    else {
      // Check if a brand with this name already exists
      const exists = await query(`SELECT * FROM shop_brands WHERE name = $1`, [name]);

      if (exists.rowCount > 0) {
        throw new Error("Brand already exists");
      }

      // Create a new brand
      const created = await query(`INSERT INTO shop_brands (name) VALUES ($1) RETURNING *`, [name]);

      if (created.rowCount === 0) {
        throw new Error("Failed to create brand");
      }

      // Handle image upload if provided
      let imageResult = null;
      if (imageFile && imageFile.size > 0) {
        try {
          imageResult = await saveBrandImage({
            brandId: created.rows[0].id,
            file: imageFile,
          });
        } catch (imageError) {
          console.error("Error saving brand image:", imageError);
          // We still return success for the brand creation even if image upload fails
        }
      }

      revalidateTag(cache_key_brands);
      revalidateTag(cache_key_products);
      return {
        ok: true,
        data: created.rows[0],
        image: imageResult,
        error: null,
      };
    }
  } catch (error) {
    console.error(`[/data/dal/shop/products/brands/create-or-update-brand.js] Error processing brand:`, error);
    return { ok: false, data: null, error: error.message };
  }
};

export default createOrUpdateBrand;
