"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { UploadCloud, X, AlertTriangle, Trash2, ImageIcon } from "lucide-react";

/**
 * DropTarget component for file uploads with preview
 * Supports drag and drop, file preview, and multiple file uploads
 *
 * @param {Object} props - Component props
 * @param {Array} props.images - Current images array
 * @param {Function} props.setImages - Function to update images
 * @param {Boolean} props.required - Whether image upload is required
 * @param {String} props.className - Additional CSS classes
 * @param {Number} props.maxFiles - Maximum number of files allowed
 * @param {Number} props.maxSize - Maximum file size in bytes (default 5MB)
 */
const DropTarget = ({
  images = [],
  setImages,
  required = false,
  className = "",
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
}) => {
  const [errors, setErrors] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Clear errors after 5 seconds
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        setErrors([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      // Handle rejected files (too large, wrong type, etc.)
      if (rejectedFiles && rejectedFiles.length > 0) {
        const newErrors = rejectedFiles.map((rejected) => {
          const file = rejected.file;
          const error = rejected.errors[0];
          return `${file.name}: ${error.message}`;
        });
        setErrors(newErrors);
      }

      // Process accepted files
      if (acceptedFiles?.length) {
        // Check if adding these files would exceed maxFiles
        if (images.length + acceptedFiles.length > maxFiles) {
          setErrors([`You can only upload a maximum of ${maxFiles} images.`]);
          // Only take what we can fit
          acceptedFiles = acceptedFiles.slice(0, maxFiles - images.length);
          if (acceptedFiles.length === 0) return;
        }

        // Convert accepted files to our format
        const newImages = acceptedFiles.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                file,
                base64: e.target.result,
                type: file.type,
                name: file.name,
                size: file.size,
                lastModified: file.lastModified,
              });
            };
            reader.readAsDataURL(file);
          });
        });

        // Add new images to existing images
        Promise.all(newImages).then((processedImages) => {
          setImages([...images, ...processedImages]);
        });
      }
    },
    [images, maxFiles, setImages]
  );

  // Set up dropzone
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/gif": [],
      "image/webp": [],
      "image/svg+xml": [],
    },
    maxSize: maxSize,
    onDrop,
    maxFiles: maxFiles - images.length,
  });

  // Handle image removal
  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Get border color based on drag state
  const getBorderColor = () => {
    if (isDragAccept) return "border-green-500";
    if (isDragReject) return "border-red-500";
    if (dragActive) return "border-blue-500";
    return "border-gray-300";
  };

  return (
    <div className="space-y-4">
      {/* Display errors if any */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-sm">The following errors occurred:</p>
            <ul className="text-xs list-disc pl-5 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps({
          className: `border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${getBorderColor()} hover:bg-gray-50 ${className}`,
        })}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDrop={() => setDragActive(false)}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          <UploadCloud className={`h-12 w-12 ${isDragAccept ? "text-green-500" : "text-gray-400"} mb-3`} />
          <p className="text-sm font-medium mb-1">Drag &amp; drop images here</p>
          <p className="text-xs text-gray-500 mb-4">PNG, JPG, GIF or WEBP up to {maxSize / (1024 * 1024)}MB</p>
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            Select Files
          </button>
        </div>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <ImageIcon className="h-4 w-4 mr-1.5" />
            Uploaded Images ({images.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group rounded-md border overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={image.base64}
                    alt={`Image preview ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove image</span>
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-black/40 py-1.5 px-3">
                  <p className="text-white text-xs truncate">{image.name || `Image ${index + 1}`}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Required warning */}
      {required && images.length === 0 && (
        <p className="text-sm text-red-500 flex items-center">
          <X className="h-4 w-4 mr-1" />
          At least one image is required
        </p>
      )}
    </div>
  );
};

export default DropTarget;
