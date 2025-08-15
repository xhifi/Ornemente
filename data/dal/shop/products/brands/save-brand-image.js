"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { uploadFile, deleteFile } from "@/lib/minio";
import sharp from "sharp";
import path from "path";
import { brands as cache_key_brands } from "@/cache_keys";

export const makeThumbnail = async (fileBuffer) => {
  const thumbnailBuffer = await sharp(fileBuffer).resize(100, 100).sharpen().toFormat("jpeg").jpeg({ quality: 80 }).toBuffer();
  return thumbnailBuffer;
};

export const resizeImage = async (fileBuffer, width, height, format = "jpeg", quality = 80) => {
  const resizedBuffer = await sharp(fileBuffer).resize(width, height).sharpen().toFormat(format).jpeg({ quality }).toBuffer();
  return resizedBuffer;
};

const saveBrandImage = async ({ brandId = 0, folder = "brands/", file }) => {
  if (!file || !folder || !brandId) {
    throw new Error("File, folder, and brandId parameters are required");
  }
  try {
    await query(`BEGIN TRANSACTION`);
    const timestamp = Date.now();
    const fileName = path.parse(file.name).name;
    const fileExtension = path.extname(file.name).toLowerCase();
    const cleanedName = fileName.replace(/[^a-zA-Z0-9.]/g, "-");
    const fileSize = file.size || 0;
    const filePath = `${folder}${brandId}/${timestamp}-${cleanedName}${fileExtension}`;
    const thumbPath = `${folder}${brandId}/${timestamp}-${cleanedName}-thumb.jpg`;
    const resize500x500Path = `${folder}${brandId}/${timestamp}-${cleanedName}-500x500.jpg`;
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

    // Create size variations as a JSON string for JSONB column
    const sizeVariationsJson = JSON.stringify({
      thumbnail: {
        path: uploadThumb.url,
        key: thumbPath,
        width: 100,
        height: 100,
        format: "jpeg",
        size: thumbnailBuffer.length,
      },
      medium: {
        path: uploadResize.url,
        key: resize500x500Path,
        width: 500,
        height: 500,
        format: "jpeg",
        size: resized500x500.length,
      },
    });

    // First, delete any existing images for this brand
    await query(`DELETE FROM shop_images WHERE brand_id = $1`, [brandId]);

    // Then insert the new image
    const recordInDB = await query(
      `INSERT INTO shop_images
        (brand_id, 
        path, 
        key,
        name, 
        mime_type,
        size,
        selected,
        position,
        size_variations) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb) RETURNING *`,
      [brandId, uploadSrc.url, filePath, file.name, file.type, fileSize, true, 1, sizeVariationsJson]
    );

    if (!recordInDB || recordInDB.rowCount === 0) {
      await query(`ROLLBACK`);
      await Promise.all([deleteFile(filePath), deleteFile(thumbPath), deleteFile(resize500x500Path)]);
      throw new Error("Failed to save image record in database");
    }

    console.log(`Brand image uploaded and saved to database: ${filePath}`);
    revalidateTag(cache_key_brands);

    await query(`COMMIT`);

    return {
      key: recordInDB.rows[0].key,
      url: recordInDB.rows[0].path,
      name: recordInDB.rows[0].name,
      id: recordInDB.rows[0].id,
      size_variations: recordInDB.rows[0].size_variations || {
        thumbnail: { path: uploadThumb.url },
        medium: { path: uploadResize.url },
      },
    };
  } catch (error) {
    console.error("Error processing brand image upload:", error);
    await query(`ROLLBACK`);
    throw error;
  }
};

export default saveBrandImage;
