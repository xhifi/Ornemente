"use server";

import { query } from "@/lib/db";
import getProductById from "./get-product-by-id";
import { revalidateTag } from "next/cache";
import {
  product as cache_key_product,
  products as cache_key_products,
  types as cache_key_types,
  colors as cache_key_colors,
  brands as cache_key_brands,
} from "@/cache_keys";

const updateProduct = async (data) => {
  try {
    const { id, name, description, tagline, variant, type, brand, original_price, discount, note, sizes, designs, pieces } = data;
    const productExists = await query(`SELECT id FROM shop_products WHERE id = $1`, [id]);
    if (productExists.rowCount === 0) {
      throw new Error(`Product with ID ${id} does not exist`);
    }

    const updateProduct = await query(
      `
        UPDATE shop_products SET
        name = $1,
        description = $2,
        tagline = $3,
        variant = $4,
        type = $5,
        brand = $6,
        original_price = $7,
        discount = $8,
        note = $9
        WHERE id = $10
        RETURNING *;
    `,
      [name, description, tagline, variant, type, brand, original_price, discount, note, id]
    );

    if (!updateProduct.rowCount) {
      throw new Error(`Failed to update product with ID ${id}`);
    }

    // Update product sizes
    if (sizes && sizes.length > 0) {
      sizes.forEach(async (size) => {
        const sizeUpdated = await query(
          `INSERT INTO shop_product_sizes (product_id, size_id, stock)
           VALUES ($1, $2, $3)
           ON CONFLICT (product_id, size_id) DO UPDATE SET stock = EXCLUDED.stock
            RETURNING *
          `,
          [id, size.code, size.stock]
        );
      });
    }
    // Update product designs
    if (designs && designs.length > 0) {
      designs.forEach(async (design) => {
        const designUpdated = await query(
          `INSERT INTO shop_product_designs (product_id, design_id)
           VALUES ($1, $2)
           ON CONFLICT (product_id, design_id) DO NOTHING
           RETURNING *
          `,
          [id, design.id]
        );
      });
    }

    // // Update product pieces
    // if (pieces && pieces.length > 0) {
    //   pieces.forEach(async (piece) => {
    //     const pieceUpdated = await query(
    //       `INSERT INTO shop_pieces (product_id, name, description, fabric, color)
    //        VALUES ($1, $2, $3, $4, $5)
    //        RETURNING *
    //       `,
    //       [id, piece.name, piece.description, piece.fabric, piece.color]
    //     );
    //   });
    // }
    revalidateTag(cache_key_product(data.id));
    revalidateTag(cache_key_products);
    revalidateTag(cache_key_types);
    revalidateTag(cache_key_colors);
    revalidateTag(cache_key_brands);

    const productData = await getProductById(id);
    return productData;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export default updateProduct;
