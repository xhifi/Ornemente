"use server";

import { deleteFile, listFiles } from "@/lib/minio";
import { query } from "@/lib/db"; // Assuming you have a query function to interact with your database
import { revalidateTag } from "next/cache";
import { product as cache_key_product, products as cache_key_products } from "@/cache_keys";

const deleteProductImage = async (imageKey) => {
  if (!imageKey) {
    throw new Error("Image path is required");
  }
  const fileExtension = imageKey.split(".").pop();
  const fileName = imageKey.split("/").pop();
  const fileNameWithoutExtension = fileName.replace(`.${fileExtension}`, "");
  const filePath = imageKey.split("/").slice(0, -1).join("/");
  const thumbnailPath = `${filePath}/${fileNameWithoutExtension}-thumb.jpg`;
  const size500x500Path = `${filePath}/${fileNameWithoutExtension}-500x500.jpg`;

  try {
    await query(`BEGIN TRANSACTION`);
    // Delete the image file from MinIO
    const existsInDb = await query(`SELECT * FROM shop_images WHERE key = $1`, [imageKey]);

    if (existsInDb.rowCount === 0) {
      await query(`ROLLBACK`);
      throw new Error(`Image path ${imageKey} does not exist in the database`);
    }

    const [existsInMinio, existsInThumbnail, existsInSize500x500] = await Promise.all([
      (await listFiles(imageKey)).some((file) => file.Key === imageKey),
      (await listFiles(thumbnailPath)).some((file) => file.Key === thumbnailPath),
      (await listFiles(size500x500Path)).some((file) => file.Key === size500x500Path),
    ]);

    const deletedFromMinio = await Promise.all([
      existsInMinio && (await deleteFile(imageKey)),
      existsInThumbnail && (await deleteFile(thumbnailPath)),
      existsInSize500x500 && (await deleteFile(size500x500Path)),
    ]);

    // if (deletedFromMinio.some((result) => !result.success)) {
    //   await query(`ROLLBACK`);
    //   throw new Error(`Failed to delete image from MinIO: ${deletedFromMinio.map((result) => result.message).join(", ")}`);
    // }

    const deletedFromDb = await query(`DELETE FROM shop_images WHERE key = $1 RETURNING *`, [imageKey]);

    if (deletedFromDb.rowCount === 0) {
      await query(`ROLLBACK`);
      throw new Error(`There was some error deleting from the database`);
    }
    await query(`COMMIT`);

    revalidateTag(cache_key_product(existsInDb.rows[0].product_id));
    revalidateTag(cache_key_products);

    return { ok: true, data: deletedFromMinio, error: null };
  } catch (error) {
    console.error(`[/data/dal/shop/products/delete-product-image.js] Error deleting product image:`, error);
    await query(`ROLLBACK`);
    return { ok: false, data: null, error: error.message };
  }
};

export default deleteProductImage;
