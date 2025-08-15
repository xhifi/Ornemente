"use server";

import { query } from "@/lib/db"; // Assuming you have a query function to interact with your database
import { revalidateTag } from "next/cache";
import { product as cache_key_product, products as cache_key_products } from "@/cache_keys";

const deleteProductPiece = async (productID, pieceID) => {
  if (!productID || !pieceID) {
    return { ok: false, data: null, error: "Invalid product or piece" };
  }

  try {
    const existsInDB = await query(`SELECT * FROM shop_pieces WHERE id = $1 AND product_id = $2`, [pieceID, productID]);
    if (!existsInDB.rowCount) {
      throw new Error("Piece not found");
    }
    const deleted = await query(`DELETE FROM shop_pieces WHERE id = $1 AND product_id = $2 RETURNING *`, [pieceID, productID]);
    if (!deleted.rowCount) {
      throw new Error("Failed to delete piece");
    }

    revalidateTag(cache_key_product(productID));
    revalidateTag(cache_key_products);

    return { ok: true, data: deleted.rows[0], error: null };
  } catch (error) {
    console.error(`[/data/dal/shop/products/delete-product-piece.js] Error deleting product piece:`, error);
    return { ok: false, data: null, error: error.message };
  }
};

export default deleteProductPiece;
