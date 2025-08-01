"use server";

import { query } from "@/lib/db";
import getProductById from "./get-product-by-id";
import { revalidateTag } from "next/cache";

const updateProduct = async (data) => {
  try {
    const { id, name, description, tagline, sex, type, brand, original_price, discount, note, sizes, designs, pieces } = data;
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
        sex = $4,
        type = $5,
        brand = $6,
        original_price = $7,
        discount = $8,
        note = $9
        WHERE id = $10
        RETURNING *;
    `,
      [name, description, tagline, sex, type, brand, original_price, discount, note, id]
    );
    console.log(`--> Updated product:`, updateProduct.rows);
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
        console.log(`--> Updated product size:`, sizeUpdated.rows);
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
        console.log(`--> Updated product design:`, designUpdated.rows);
      });
    }

    // Update product pieces
    if (pieces && pieces.length > 0) {
      pieces.forEach(async (piece) => {
        // Assuming pieces have fields product_id, name, description, fabric, color
        // Upon updating we will insert or update the piece
        const pieceUpdated = await query(
          `INSERT INTO shop_pieces (product_id, name, description, fabric, color)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *
          `,
          [id, piece.name, piece.description, piece.fabric, piece.color]
        );
        console.log(`--> Updated product piece:`, pieceUpdated.rows);
      });
    }
    revalidateTag(`products`);
    revalidateTag(`product`);
    const productData = await getProductById(id);
    console.log(`PRODUCT UPDATED`, productData);
    return productData;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export default updateProduct;
