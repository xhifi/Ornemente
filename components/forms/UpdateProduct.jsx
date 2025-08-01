"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ComboBox from "@/components/ui/factory/form/combo-box";
import ImageUploader from "@/components/forms/ImageUploader";
import updateProductSchema from "@/data/dal/schema/update-product-schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const UpdateProduct = ({
  product,
  images = [],
  uploadImage,
  deleteImage,
  existingDesigns = [],
  existingSizes = [],
  sexes,
  types,
  brands,
  sizes,
  designs,
  fabrics,
  colors,
  action, // Server action for submitting the form
}) => {
  // Simple loading state
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Basic empty default values to start with - actual values will be set in the useEffect
  const defaultValues = {
    name: "",
    description: "",
    tagline: "",
    sex: undefined,
    type: undefined,
    brand: undefined,
    original_price: "",
    discount: "0",
    note: "",
    sizes: [],
    designs: [],
    pieces: [],
  };

  // Setup react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateProductSchema),
    defaultValues,
    mode: "onChange",
  });

  // Local state for UI management - keeping only what's needed
  const [productSizes, setProductSizes] = useState({});
  const [selectedDesigns, setSelectedDesigns] = useState(existingDesigns || []);
  const [productPieces, setProductPieces] = useState(product?.pieces || []);

  // Simplified form loading effect
  useEffect(() => {
    // Check if all required data is loaded
    const dataIsReady =
      product && sexes?.data?.length > 0 && types?.data?.length > 0 && brands?.data?.length > 0 && sizes?.data?.length > 0;

    // When data is ready, initialize form and turn off loading
    if (dataIsReady) {
      console.log("Data is ready, product data:", {
        sex_id: product.sex_id,
        type_id: product.type_id,
        brand_id: product.brand_id,
      });

      // Reset form with all initial values at once
      const initialValues = {
        name: product.name || "",
        description: product.description || "",
        tagline: product.tagline || "",
        // Set IDs directly - no delayed setValue needed
        sex: product.sex ? String(product.sex) : undefined,
        type: product.type ? String(product.type) : undefined,
        brand: product.brand ? String(product.brand) : undefined,
        original_price: String(product.original_price) || "0",
        discount: product.discount || "0",
        note: product.note || "",
        sizes: existingSizes || [],
        designs: existingDesigns || [],
        pieces: product.pieces || [],
      };

      console.log("Setting initial form values:", initialValues);

      // Set all values at once
      reset(initialValues);

      // Turn off loading immediately
      setIsLoading(false);
    }
  }, [product, sexes, types, brands, sizes, reset, existingSizes, existingDesigns]);

  // Simplified form submission handler
  const onSubmit = async (data) => {
    try {
      console.log("Form submitted with data:", data);

      // Helper function to safely convert to number
      const safeNumber = (value) => {
        if (value === undefined || value === null || value === "") return 0;
        const num = parseInt(value, 10);
        return isNaN(num) ? 0 : num;
      };

      // Convert string values back to numbers for the backend
      const processedData = {
        ...data,
        id: product.id,
        sex: safeNumber(data.sex),
        type: safeNumber(data.type),
        brand: safeNumber(data.brand),
        original_price: safeNumber(data.original_price),
        discount: safeNumber(data.discount),
      };

      console.log("Processed data for submission:", processedData);

      // Submit the form using the server action
      if (action) {
        const result = await action(processedData);
        if (result?.error) {
          alert("Error updating product: " + result.error);
        } else {
          toast.success("Product updated successfully!");
          router.push(`/dashboard/products/`);
        }
      } else {
        alert("Error: No action function provided for form submission");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert("An error occurred while submitting the form: " + error.message);
    }
  };

  // Effect to initialize product sizes with existing sizes
  useEffect(() => {
    if (sizes && sizes.data) {
      const initialSizes = {};
      sizes.data.forEach((size) => {
        // Check if this size is in existingSizes
        const existingSize = existingSizes.find((s) => s.code === size.code);

        initialSizes[size.code] = {
          selected: !!existingSize,
          stock: existingSize ? existingSize.stock : 0,
        };
      });
      setProductSizes(initialSizes);
    }
  }, [sizes, existingSizes]);

  // Effect to keep form values in sync with UI state
  useEffect(() => {
    // Update sizes in the form
    const selectedSizes = Object.entries(productSizes)
      .filter(([_, data]) => data.selected)
      .map(([code, data]) => ({
        code,
        stock: data.stock,
      }));
    setValue("sizes", selectedSizes);

    // Update designs and pieces
    setValue("designs", selectedDesigns);
    setValue("pieces", productPieces);
  }, [productSizes, selectedDesigns, productPieces, setValue]);

  // Check if at least one size is selected
  const hasSelectedSizes = Object.values(productSizes).some((data) => data.selected);

  // Helper function to create a new design
  const handleCreateDesign = (designName) => {
    console.log(`INVOKED CREATE DESIGN: ${designName}`);
    // This would call the API to create a new design in the database
  };

  // Functions for managing product pieces - kept as is for functionality
  const addProductPiece = () => {
    const newPiece = {
      id: Date.now(),
      name: "",
      description: "",
      fabric: 0,
      color: 0,
    };
    setProductPieces([...productPieces, newPiece]);
  };

  const updateProductPiece = (index, field, value) => {
    const updatedPieces = [...productPieces];
    updatedPieces[index][field] = field === "fabric" || field === "color" ? Number(value) : value;
    setProductPieces(updatedPieces);
  };

  const removeProductPiece = (index) => {
    setProductPieces(productPieces.filter((_, i) => i !== index));
  };

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-lg font-medium mb-4">Loading product data...</p>
        </div>
      ) : (
        <form className="py-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Update Product</CardTitle>
              <CardDescription>Edit product details and specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter product name"
                      {...register("name")}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      placeholder="Enter product tagline"
                      {...register("tagline")}
                      className={errors.tagline ? "border-destructive" : ""}
                    />
                    {errors.tagline && <p className="text-destructive text-xs">{errors.tagline.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
                    {...register("description")}
                    className={errors.description ? "border-destructive" : ""}
                  />
                  {errors.description && <p className="text-destructive text-xs">{errors.description.message}</p>}
                </div>
              </div>

              {/* Categories & Type */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Gender Select using shadcn/ui with proper controller */}
                <div className="space-y-2">
                  <Label htmlFor="sex">Gender</Label>
                  <Controller
                    name="sex"
                    control={control}
                    render={({ field }) => {
                      console.log("Gender field value:", field);

                      return (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="sex" className={errors.sex ? "border-destructive w-full" : "w-full"}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {sexes?.data?.map((gender) => (
                              <SelectItem key={gender.id} value={String(gender.id)}>
                                {gender.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  />
                  {errors.sex && <p className="text-destructive text-xs">{errors.sex.message}</p>}
                </div>

                {/* Type Select using shadcn/ui with proper controller */}
                <div className="space-y-2">
                  <Label htmlFor="type">Type of Dress</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => {
                      console.log("Type field value:", field.value);

                      return (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="type" className={errors.type ? "border-destructive w-full" : "w-full"}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {types?.data?.map((type) => (
                              <SelectItem key={type.id} value={String(type.id)}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  />
                  {errors.type && <p className="text-destructive text-xs">{errors.type.message}</p>}
                </div>

                {/* Brand Select using shadcn/ui with proper controller */}
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Controller
                    name="brand"
                    control={control}
                    render={({ field }) => {
                      console.log("Brand field value:", field.value);

                      return (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="brand" className={errors.brand ? "border-destructive w-full" : "w-full"}>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands?.data?.map((brand) => (
                              <SelectItem key={brand.id} value={String(brand.id)}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  />
                  {errors.brand && <p className="text-destructive text-xs">{errors.brand.message}</p>}
                </div>
              </div>

              {/* Pricing */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price</Label>
                  <Input
                    id="original_price"
                    type="number"
                    placeholder="Enter original price"
                    {...register("original_price")}
                    className={errors.original_price ? "border-destructive" : ""}
                  />
                  {errors.original_price && <p className="text-destructive text-xs">{errors.original_price.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    placeholder="Enter discount percentage"
                    {...register("discount")}
                    className={errors.discount ? "border-destructive" : ""}
                  />
                  {errors.discount && <p className="text-destructive text-xs">{errors.discount.message}</p>}
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note">Notes</Label>
                <Textarea
                  id="note"
                  placeholder="Enter additional notes"
                  {...register("note")}
                  className={errors.note ? "border-destructive" : ""}
                />
                {errors.note && <p className="text-destructive text-xs">{errors.note.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Sizes */}
          <Card>
            <CardHeader>
              <CardTitle>Available Sizes & Quantities</CardTitle>
              <CardDescription>Select sizes available for this product and set stock quantities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {sizes?.data?.map((size) => {
                  const sizeData = productSizes[size.code] || { selected: false, stock: 0 };

                  return (
                    <div
                      key={size.code}
                      onClick={() => {
                        setProductSizes((prev) => ({
                          ...prev,
                          [size.code]: {
                            ...sizeData,
                            selected: !sizeData.selected,
                          },
                        }));
                      }}
                      className={`flex items-center justify-center p-3 rounded-md border-2 cursor-pointer transition-all ${
                        sizeData.selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-lg font-medium">{size.code}</span>
                    </div>
                  );
                })}
              </div>

              {!hasSelectedSizes && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                  Please select at least one size for this product
                </div>
              )}

              {hasSelectedSizes && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Set Quantity for Selected Sizes</h3>
                  <div className="space-y-2">
                    {Object.entries(productSizes)
                      .filter(([_, data]) => data.selected)
                      .map(([code, data]) => (
                        <div key={code} className="flex items-center gap-2">
                          <span className="font-medium w-12">{code}</span>
                          <Input
                            type="number"
                            placeholder="Quantity"
                            value={data.stock}
                            onChange={(e) => {
                              setProductSizes((prev) => ({
                                ...prev,
                                [code]: {
                                  ...data,
                                  stock: Number(e.target.value),
                                },
                              }));
                            }}
                            min="0"
                            className="w-24"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {errors.sizes && <p className="text-destructive text-xs mt-2">{errors.sizes.message}</p>}
            </CardContent>
          </Card>

          {/* Designs */}
          <Card>
            <CardHeader>
              <CardTitle>Design Selection</CardTitle>
              <CardDescription>Select one or more designs for this product</CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                name="designs"
                control={control}
                render={({ field }) => (
                  <ComboBox
                    options={designs?.data || []}
                    selectedOptions={selectedDesigns}
                    setSelectedOptions={(options) => setSelectedDesigns(options)}
                    placeholder="Search designs..."
                    handleCreateOption={handleCreateDesign}
                    colorTheme="green"
                  />
                )}
              />
              {errors.designs && <p className="text-destructive text-xs mt-2">{errors.designs.message}</p>}
            </CardContent>
          </Card>

          {/* Product Pieces */}
          <Card>
            <CardHeader>
              <CardTitle>Product Pieces/Parts</CardTitle>
              <CardDescription>Add pieces/parts that make up this product (e.g., shirt, dupatta, trouser)</CardDescription>
            </CardHeader>
            <CardContent>
              {productPieces.length > 0 ? (
                <div className="space-y-4">
                  {productPieces.map((piece, index) => (
                    <Card key={piece.id}>
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">Piece #{index + 1}</CardTitle>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeProductPiece(index)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        <div className="space-y-2">
                          <Label>Piece Name</Label>
                          <Input
                            placeholder="e.g., Shirt, Dupatta, Trouser"
                            value={piece.name}
                            onChange={(e) => updateProductPiece(index, "name", e.target.value)}
                            className={errors.pieces?.[index]?.name ? "border-destructive" : ""}
                          />
                          {errors.pieces?.[index]?.name && <p className="text-destructive text-xs">{errors.pieces[index].name.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Describe this piece..."
                            value={piece.description || ""}
                            onChange={(e) => updateProductPiece(index, "description", e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Fabric</Label>
                            <Select
                              value={String(piece.fabric || 0)}
                              onValueChange={(value) => updateProductPiece(index, "fabric", Number(value))}
                            >
                              <SelectTrigger className={errors.pieces?.[index]?.fabric ? "border-destructive" : ""}>
                                <SelectValue placeholder="Select a fabric" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Select a fabric</SelectItem>
                                {fabrics?.data?.map((fabric) => (
                                  <SelectItem key={fabric.id} value={String(fabric.id)}>
                                    {fabric.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.pieces?.[index]?.fabric && (
                              <p className="text-destructive text-xs">{errors.pieces[index].fabric.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Color</Label>
                            <Select
                              value={String(piece.color || 0)}
                              onValueChange={(value) => updateProductPiece(index, "color", Number(value))}
                            >
                              <SelectTrigger className={errors.pieces?.[index]?.color ? "border-destructive" : ""}>
                                <SelectValue placeholder="Select a color" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Select a color</SelectItem>
                                {colors?.data?.map((color) => (
                                  <SelectItem key={color.id} value={String(color.id)}>
                                    {color.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.pieces?.[index]?.color && (
                              <p className="text-destructive text-xs">{errors.pieces[index].color.message}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 bg-secondary/20 border border-dashed rounded-lg">
                  <div className="text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mx-auto h-12 w-12 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-muted-foreground">No product pieces added yet</p>
                  </div>
                </div>
              )}

              <Button type="button" className="w-full mt-4" onClick={addProductPiece} variant="outline">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Product Piece
              </Button>

              {errors.pieces && !Array.isArray(errors.pieces) && <p className="text-destructive text-xs mt-2">{errors.pieces.message}</p>}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Upload and manage product images</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader images={images} productId={product?.id} uploadImage={uploadImage} deleteImage={deleteImage} />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Product"}
          </Button>

          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <h3 className="text-destructive font-medium mb-2">Please fix the following errors:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field} className="text-destructive text-sm">
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      )}
    </>
  );
};

export default UpdateProduct;
