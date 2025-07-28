"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import Image from "next/image";
import ImageGallery from "@/components/ui/form/image-gallery";

/**
 * ImageUploader component for the UpdateProduct form
 * This component handles uploading and managing product images
 * It uses the ImageGallery component to render a Splide slider with product images
 * and a dropzone for uploading new images
 */
const ImageUploader = ({ images = [], productId, uploadImage, deleteImage }) => {
  // Use a ref to store the initial images to prevent unnecessary state updates
  const initialImagesRef = useRef(images);
  const [productImages, setProductImages] = useState(images);
  const [isUploading, setIsUploading] = useState(false);

  // Sync with incoming images prop only on initial mount or when images length changes significantly
  useEffect(() => {
    if (
      // Only update if:
      // 1. We have different image counts (indicates a major change from parent)
      images.length !== productImages.length ||
      // 2. This is initial load
      productImages === initialImagesRef.current
    ) {
      console.log("ImageUploader: Updating images from props", images.length);
      setProductImages(images);
    }
  }, [images, productImages]);

  // Handle image change (add/remove)
  const handleImagesChange = async (updatedImages) => {
    // Check if there are new images to upload (that don't have id)
    const newImages = updatedImages.filter((img) => !img.id && img.file);

    if (newImages.length > 0) {
      setIsUploading(true);

      try {
        // Process each new image
        for (const image of newImages) {
          // Call the server action to upload the image
          const result = await uploadImage({
            productId,
            file: image.file,
            folder: `products/`,
          });

          // Update the image in the array with the returned data
          if (result) {
            // Remove the uploaded image and replace with the saved version
            const imageIndex = updatedImages.findIndex((img) => img === image || (img.path === image.path && img.name === image.name));

            if (imageIndex !== -1) {
              updatedImages[imageIndex] = {
                ...result,
                id: Date.now(), // Use temporary ID if not returned from server
                selected: true,
                name: image.name || result.name,
              };
            }
          }
        }
      } catch (error) {
        console.error("Error uploading images:", error);
      } finally {
        setIsUploading(false);
      }
    }

    // Update local state with all images
    setProductImages(updatedImages);
  };

  // Handle image deletion
  const handleImageDelete = async (imagePath) => {
    if (!imagePath) return;

    try {
      // Call the server action to delete the image
      const result = await deleteImage(imagePath);

      if (result && result.success) {
        // Remove the image from the local state
        const updatedImages = productImages.filter((img) => img.path !== imagePath && img.key !== imagePath);
        setProductImages(updatedImages);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  return (
    <div className="space-y-4">
      <ImageGallery
        images={productImages}
        onChange={handleImagesChange}
        productId={productId}
        deleteImage={async (key) => {
          // Handle deletion directly to ensure proper state updates
          if (!key) return;

          try {
            // Call the server action to delete the image
            const result = await deleteImage(key);

            // Return success or failure to ImageGallery
            return result && result.ok !== false;
          } catch (error) {
            console.error("Error in image deletion:", error);
            return false;
          }
        }}
        required={true}
      />

      {isUploading && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-md">
          <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-sm font-medium text-blue-700">Uploading images...</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
