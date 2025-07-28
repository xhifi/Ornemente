"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { uploadFile, deleteFile, listFiles } from "@/lib/minio";
import path from "path";

import sharp from "sharp";

export const makeThumbnail = async (fileBuffer) => {
  const thumbnailBuffer = await sharp(fileBuffer).resize(100, 100).sharpen().toFormat("jpeg").jpeg({ quality: 80 }).toBuffer();
  return thumbnailBuffer;
};

export const resizeImage = async (fileBuffer, width, height, format = "jpeg", quality = 80) => {
  const resizedBuffer = await sharp(fileBuffer).resize(width, height).sharpen().toFormat(format).jpeg({ quality }).toBuffer();
  return resizedBuffer;
};

const saveProductImage = async ({ productId = 0, folder = "products/", file }) => {
  if (!file || !folder) {
    throw new Error("File and folder parameters are required");
  }
  try {
    await query(`BEGIN TRANSACTION`);
    const timestamp = Date.now();
    const fileName = path.parse(file.name).name;
    const fileExtension = path.extname(file.name).toLowerCase();
    const cleanedName = fileName.replace(/[^a-zA-Z0-9.]/g, "-");
    const fileSize = file.size || 0;
    const filePath = `${folder}${productId}/${timestamp}-${cleanedName}${fileExtension}`;
    const thumbPath = `${folder}${productId}/${timestamp}-${cleanedName}-thumb.jpg`; // products/productID/productId-cleanedName-thumb.ext
    const resize500x500Path = `${folder}${productId}/${timestamp}-${cleanedName}-500x500.jpg`; // products/productID/productId-cleanedName-500x500.ext
    const fileBuffer = await file.arrayBuffer();

    const [thumbnailBuffer, resized500x500] = await Promise.all([
      await makeThumbnail(fileBuffer),
      await resizeImage(fileBuffer, 500, 500, "jpeg", 80),
    ]);

    const [uploadSrc, uploadThumb, uploadResize] = await Promise.all([
      await uploadFile(fileBuffer, filePath, file.type),
      await uploadFile(thumbnailBuffer, thumbPath, "image/jpeg"),
      await uploadFile(resized500x500, resize500x500Path, "image/jpeg"),
    ]);
    if (!uploadSrc || !uploadThumb || !uploadResize) {
      await query(`ROLLBACK`);
      throw new Error("Failed to upload one or more files");
    }
    const recordInDB = await query(
      `INSERT INTO shop_images
        (product_id, 
        path, 
        key,
        name, 
        mime_type,
        size) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [productId, uploadSrc.url, filePath, file.name, file.type, fileSize]
    );
    if (!recordInDB || recordInDB.rowCount === 0) {
      await query(`ROLLBACK`);
      await Promise.all([await deleteFile(filePath), await deleteFile(thumbPath), await deleteFile(resize500x500Path)]);
      throw new Error("Failed to save image record in database");
    }
    console.log(`Image uploaded and saved to database: ${filePath}`);
    revalidateTag("shop-files"); // Revalidate cache for shop files

    await query(`COMMIT`);

    return {
      key: recordInDB.rows[0].key,
      url: recordInDB.rows[0].path,
      name: recordInDB.rows[0].name,
      thumbnailUrl: uploadThumb.url,
      resized500x500Url: uploadResize.url,
    };
  } catch (error) {
    console.error("Error processing image upload:", error);
    await query(`ROLLBACK`);
    throw error;
  }
};

export default saveProductImage;
