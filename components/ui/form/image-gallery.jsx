"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import Image from "next/image";
import { UploadCloud, Trash2, ImageIcon, X, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * ImageGallery component that handles displaying and uploading product images
 *
 * @param {Object} props - Component props
 * @param {Array} props.images - Initial array of images
 * @param {Function} props.onChange - Callback when images change
 * @param {Number} props.productId - Product ID for storage paths
 * @param {Boolean} props.disabled - Whether the component is disabled
 * @param {String} props.className - Additional CSS classes
 * @param {Boolean} props.required - Whether at least one image is required
 */
export default function ImageGallery({
  images = [],
  deleteImage,
  onChange,
  productId,
  disabled = false,
  className = "",
  required = false,
}) {
  // State for component
  const [localImages, setLocalImages] = useState(images);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // For carousel display
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);

  // Update localImages when images prop changes
  useEffect(() => {
    // Only update if the images array has changed and is valid
    if (images && Array.isArray(images)) {
      console.log("ImageGallery: Updated localImages from props", images.length);
      console.log("Images prop updated:", images.length);
      setLocalImages(images);
    }
  }, [images]);

  /**
   * Process files (either from input or drop event)
   */
  const processFiles = useCallback(
    async (files) => {
      if (!files || files.length === 0) {
        console.warn("No files to process");
        return;
      }

      console.log(`Processing ${files.length} files for upload`);
      setLoading(true);
      try {
        const filesArray = Array.from(files);
        const newImages = [];

        for (let i = 0; i < filesArray.length; i++) {
          const file = filesArray[i];

          if (!file || !file.type || !file.type.startsWith("image/")) {
            console.warn(`Skipping file ${i}: not a valid image file`, file?.name);
            continue;
          }

          console.log(`Processing file ${i + 1}/${filesArray.length}: ${file.name}`);

          // Calculate progress
          const progressPercent = Math.round((i / filesArray.length) * 100);
          setUploadProgress(progressPercent);

          // Convert to base64 for preview
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });

          // Create normalized file name (for storage path)
          const timestamp = Date.now();
          const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const path = `products/${productId}/${timestamp}_${safeFileName}`;

          // Add to new images array
          newImages.push({
            file,
            base64,
            type: file.type,
            name: file.name,
            path,
            key: path, // Key and path are the same for storage consistency
            size: file.size,
            // These will be set when saved to database
            id: null,
            selected: true,
            position: localImages.length + newImages.length,
          });
        }

        // Update local state and call onChange
        const updatedImages = [...localImages, ...newImages];
        setLocalImages(updatedImages);
        if (onChange) {
          onChange(updatedImages);
        }
      } catch (error) {
        console.error("Error processing image files:", error);
      } finally {
        // Reset state
        setLoading(false);
        setUploadProgress(0);
        setUploadDialogOpen(false);
      }
    },
    [localImages, onChange, productId]
  );

  /**
   * Handle file selection from input
   */
  const handleFileSelect = useCallback(
    (e) => {
      console.log("File selection event triggered", e.target.files?.length || 0, "files");
      try {
        if (!e.target.files || e.target.files.length === 0) {
          console.warn("No files selected in file dialog");
          return;
        }
        processFiles(e.target.files);
      } catch (error) {
        console.error("Error handling file selection:", error);
        // Reset loading state in case of error
        setLoading(false);
      }
    },
    [processFiles]
  );

  /**
   * Handle drag and drop
   */
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  /**
   * Handle drag events
   */
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // /**
  //  * Delete an image
  //  */
  // const deleteImage = useCallback(
  //   (index) => {
  //     if (disabled) return;

  //     const newImages = [...localImages];
  //     newImages.splice(index, 1);
  //     setLocalImages(newImages);
  //     onChange(newImages);
  //   },
  //   [localImages, onChange, disabled]
  // );

  /**
   * Open the file dialog
   */
  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      console.log("Opening file dialog");
      // Reset the value to ensure onChange fires even if the same file is selected again
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    } else {
      console.error("File input reference is not available");
    }
  }, []);

  // Render the image gallery
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Display Section */}
      {localImages.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <ImageIcon className="w-4 h-4 mr-2 text-muted-foreground" />
              <h3 className="text-sm font-medium">Product Images ({localImages.length})</h3>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)} disabled={disabled}>
              <UploadCloud className="w-4 h-4 mr-2" />
              Add Images
            </Button>
          </div>

          {/* Image Carousel */}
          <div className="p-4">
            <Splide
              options={{
                perPage: 4,
                gap: "1rem",
                pagination: false,
                drag: true,
                arrows: localImages.length > 4,
                breakpoints: {
                  640: { perPage: 1 },
                  768: { perPage: 2 },
                  1024: { perPage: 3 },
                  1280: { perPage: 4 },
                },
              }}
              onMounted={(splide) => {
                setTotalSlides(splide.length);
              }}
              onMove={(splide) => {
                setCurrentSlide(splide.index);
              }}
            >
              {localImages.map((image, index) => {
                // Determine if the image has a valid source to display
                const hasValidSource = Boolean(
                  image.base64 || image.url || (image.path && (image.path.startsWith("http") || image.path.startsWith("/")))
                );

                // Skip invalid images in a production environment
                if (!hasValidSource) {
                  console.warn("Image with invalid source found:", { ...image, file: image.file ? "File present" : "No file" });
                }

                return (
                  <SplideSlide key={`img-${index}`} className="h-full">
                    <div className="relative group border rounded-md overflow-hidden">
                      <div className="relative aspect-square">
                        <Image
                          src={
                            image.base64
                              ? image.base64
                              : image.url
                              ? image.url
                              : image.path && (image.path.startsWith("http") || image.path.startsWith("/"))
                              ? image.path
                              : "/placeholder-image.jpg"
                          }
                          alt={`Product image ${index + 1}`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            e.target.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ddd' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='m21 15-5-5L5 21'/%3E%3C/svg%3E";
                            e.target.style.padding = "25%";
                          }}
                        />
                      </div>
                      {/* Delete button */}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              // Determine which identifier to use for deletion
                              const deleteIdentifier = image.key || image.path || image.id;
                              console.log("Deleting image with identifier:", deleteIdentifier);

                              if (!deleteIdentifier) {
                                console.error("No valid identifier found for image deletion");
                                return;
                              }

                              // Call the deleteImage function from props
                              await deleteImage(deleteIdentifier);

                              // Update the local state to instantly reflect changes in UI
                              // We need to find the exact image to remove
                              const updatedImages = localImages.filter((img) => {
                                // For matching the exact image to remove
                                if (image.key && img.key) {
                                  // If we have keys, use them for exact matching (most reliable)
                                  return img.key !== image.key;
                                } else if (image.id && img.id) {
                                  // If we have IDs, use them for matching
                                  return img.id !== image.id;
                                } else if (image.path && img.path) {
                                  // Fall back to path matching
                                  return img.path !== image.path;
                                } else {
                                  // Last resort: check by object reference
                                  return img !== image;
                                }
                              });

                              console.log(`Filtered images: ${updatedImages.length} (from ${localImages.length})`);

                              // Set the updated images regardless of count change
                              setLocalImages(updatedImages);

                              // Notify parent component of the change
                              if (onChange) {
                                onChange(updatedImages);
                              }
                            } catch (error) {
                              console.error("Error deleting image:", error);
                            }
                          }}
                          className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Delete image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Image caption */}
                      <div className="bg-gray-100 p-1.5 text-xs truncate">{image.name || `Image ${index + 1}`}</div>
                    </div>
                  </SplideSlide>
                );
              })}
            </Splide>

            {/* Pagination indicator */}
            {localImages.length > 4 && (
              <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
                <span>
                  {Math.min(currentSlide + 1, totalSlides)} of {totalSlides}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div
          onClick={() => setUploadDialogOpen(true)}
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors 
            ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"} 
            ${disabled ? "pointer-events-none opacity-60" : ""}`}
        >
          <div className="bg-muted/50 p-3 rounded-full mb-3">
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No product images</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Drag and drop product images here, or click to browse and select files
          </p>
          <Button type="button" size="sm" disabled={disabled}>
            <UploadCloud className="w-4 h-4 mr-2" /> Upload Images
          </Button>
        </div>
      )}

      {/* Error message if required */}
      {required && localImages.length === 0 && (
        <p className="text-sm text-destructive flex items-center">
          <X className="w-4 h-4 mr-1" />
          At least one product image is required
        </p>
      )}

      {/* File Input (hidden) */}
      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" disabled={disabled} />

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Product Images</DialogTitle>
          </DialogHeader>

          {/* Drag & Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"
            } flex flex-col items-center justify-center text-center`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {loading ? (
              /* Loading State */
              <div className="flex flex-col items-center py-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <p className="text-sm font-medium">Uploading images...</p>
                <div className="w-full max-w-xs bg-muted h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            ) : (
              /* Upload State */
              <>
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                <h4 className="text-base font-medium mb-1">Drag images here</h4>
                <p className="text-sm text-muted-foreground mb-4">or click the button below to browse</p>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openFileDialog();
                  }}
                  size="sm"
                >
                  Select Files
                </Button>
                <p className="text-xs text-muted-foreground mt-4">Supports: JPG, PNG, GIF, WEBP up to 5MB</p>
              </>
            )}
          </div>

          <DialogFooter>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setUploadDialogOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  openFileDialog();
                }}
                disabled={loading}
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
