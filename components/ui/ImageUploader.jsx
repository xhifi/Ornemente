"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { Upload, X, Plus, Trash2 } from "lucide-react";

/**
 * ImageUploader - A clean implementation of an image upload component
 * Uses direct server actions to handle image uploads to both storage and database
 *
 * @param {Object} props
 * @param {Array} props.images - Array of product images from the database
 * @param {Function} props.onImagesChange - Function to handle changes to images array
 * @param {number} props.productId - ID of the product
 * @param {boolean} props.disabled - Whether the uploader is disabled
 */
const ImageUploader = ({ images = [], onImagesChange, productId, disabled = false }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Accept only image file types
  const fileTypes = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
  };

  // Handle file drop using react-dropzone
  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (disabled || !productId || acceptedFiles.length === 0) return;

      setIsUploading(true);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append("product_id", productId);

        // Add each file to the FormData
        acceptedFiles.forEach((file) => {
          formData.append("files", file);
        });

        // Use the server action to handle the upload
        const { handleFormUpload } = await import("@/data/dal/shop/file-system/image-actions");
        const result = await handleFormUpload(formData);

        if (result.error) {
          throw new Error(result.error);
        }

        // If successful, update the images array with the new images
        if (result.success && result.results) {
          const newImages = result.results.filter((r) => r.success).map((r) => r.image);

          // Call the parent's change handler with the new images
          onImagesChange([...images, ...newImages]);
        }
      } catch (error) {
        console.error("Error uploading images:", error);
        setUploadError(error.message || "Failed to upload images");
      } finally {
        setIsUploading(false);
      }
    },
    [productId, images, onImagesChange, disabled]
  );

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: fileTypes,
    disabled: disabled || isUploading,
  });

  // Handle image deletion
  const handleDeleteImage = async (imageId) => {
    if (disabled || !imageId) return;

    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      // Use the server action to delete the image
      const { deleteImage } = await import("@/data/dal/shop/file-system/image-actions");
      const result = await deleteImage(imageId);

      if (result.error) {
        throw new Error(result.error);
      }

      // If successful, remove the image from the local array
      if (result.success) {
        const updatedImages = images.filter((img) => img.id !== imageId);
        onImagesChange(updatedImages);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 transition-all
          ${isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <input {...getInputProps()} disabled={disabled} />

        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-3">
            <Upload className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-700">{isDragActive ? "Drop images here" : "Drag & drop images here"}</p>
          <p className="text-sm text-gray-500 mb-3">or click to browse files</p>

          {isUploading && (
            <div className="mt-2 flex items-center space-x-2">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
              <span className="text-sm text-blue-500">Uploading...</span>
            </div>
          )}

          {uploadError && <p className="mt-2 text-sm text-red-500">{uploadError}</p>}
        </div>
      </div>

      {/* Image Gallery */}
      {images && images.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Product Images</h3>

          <Splide
            options={{
              perPage: 4,
              gap: "1rem",
              pagination: false,
              drag: true,
              arrows: images.length > 4,
              breakpoints: {
                640: { perPage: 2 },
                768: { perPage: 3 },
                1024: { perPage: 4 },
              },
            }}
          >
            {images.map((image) => (
              <SplideSlide key={image.id}>
                <div className="relative group">
                  <div className="aspect-square relative border rounded-md overflow-hidden">
                    <Image
                      src={image.url}
                      alt={image.name || "Product image"}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                      onError={(e) => {
                        e.target.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="%23ddd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(image.id)}
                    disabled={disabled}
                    className="absolute top-1 right-1 bg-white/80 hover:bg-white text-red-500 hover:text-red-600 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </SplideSlide>
            ))}
          </Splide>
        </div>
      ) : null}
    </div>
  );
};

export default ImageUploader;
