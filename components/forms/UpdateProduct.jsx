"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ComboBox from "@/components/ui/factory/form/combo-box";
import { z } from "zod";
import ImageUploader from "@/components/forms/ImageUploader";

// Zod schema for form validation
const zodSchema = z.object({
  // Basic product information
  name: z.string().min(1, "Product name is required").max(255, "Product name must be less than 255 characters"),
  description: z.string().optional(),
  tagline: z.string().optional(),
  sex: z.number().min(1, "Gender selection is required"),
  type: z.coerce.number().min(1, "Product type is required"),
  brand: z.coerce.number().min(1, "Brand is required"),
  original_price: z.coerce.number().positive("Price must be greater than zero"),
  discount: z.coerce.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").default(0),
  note: z.string().optional(),

  // Product sizes with stock information
  sizes: z
    .array(
      z.object({
        code: z.string().min(1, "Size code is required"),
        stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
      })
    )
    .min(1, "At least one size must be selected"),
  // Product designs
  designs: z
    .array(
      z.object({
        id: z.number().min(1, "Design ID is required"),
        name: z.string().min(1, "Design name is required"),
      })
    )
    .optional(),

  // Product pieces/parts
  pieces: z
    .array(
      z.object({
        id: z.number().min(1, "Piece ID is required"),
        name: z.string().min(1, "Piece name is required"),
        description: z.string().optional(),
        fabric: z.number().min(1, "Fabric is required"),
        color: z.number().min(1, "Color is required"),
      })
    )
    .optional(),

  colors: z.number().min(1, "Color selection is required").optional(),
});

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
  // Setup react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      tagline: product?.tagline || "",
      sex: product?.sex_id || "",
      type: product?.type_id || "",
      brand: product?.brand_id || "",
      original_price: product?.original_price || "",
      discount: product?.discount || "0",
      note: product?.note || "",
      sizes: existingSizes || [],
      designs: existingDesigns || [],
      pieces: product?.pieces || [],
      colors: product?.color_id || 1,
    },
    mode: "onChange",
  });

  // Watch for changes in form values
  const watchSizes = watch("sizes", []);
  const watchPieces = watch("pieces", []);
  const watchDesigns = watch("designs", []);

  // Local state for UI management
  const [productSizes, setProductSizes] = useState({});
  const [selectedDesigns, setSelectedDesigns] = useState(existingDesigns || []);
  const [productPieces, setProductPieces] = useState(product?.pieces || []);

  // Ref to persist productSizes across renders
  const productSizesRef = useRef(productSizes);

  // Form submission handler
  const onSubmit = async (data) => {
    console.log(`DATA SUBMITTED:`, data);
    try {
      // Convert form data to the format expected by the server
      const formData = new FormData();

      // Add basic form fields
      Object.keys(data).forEach((key) => {
        if (key !== "images" && key !== "sizes" && key !== "designs" && key !== "pieces") {
          formData.append(key, data[key]);
        }
      });

      // Add sizes as JSON
      formData.append("sizes", JSON.stringify(data.sizes));

      // Add designs as JSON
      formData.append("designs", JSON.stringify(data.designs.map((design) => design.id)));

      // Add pieces as JSON
      formData.append("pieces", JSON.stringify(data.pieces));

      console.log("Form data before submission:", formData);

      // Submit the form using the server action
      if (action) {
        const result = await action(formData);

        if (result?.error) {
          console.error("Error updating product:", result.error);
        } else {
          console.log("Product updated successfully:", result);
        }
      } else {
        console.warn("No action function provided for form submission");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
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

  useEffect(() => {
    const selectedSizes = Object.entries(productSizes)
      .filter(([_, data]) => data.selected)
      .map(([code, data]) => ({
        code,
        stock: data.stock,
      }));

    setValue("sizes", selectedSizes, { shouldValidate: true });
  }, [productSizes, setValue]);

  // Effect to sync selectedDesigns state with the form
  useEffect(() => {
    setValue("designs", selectedDesigns, { shouldValidate: true });
  }, [selectedDesigns, setValue]);

  // Effect to sync productPieces state with the form
  useEffect(() => {
    setValue("pieces", productPieces, { shouldValidate: true });
  }, [productPieces, setValue]);

  // Check if at least one size is selected
  const hasSelectedSizes = Object.values(productSizes).some((data) => data.selected);

  // Check if all required pieces fields are filled in
  const hasValidPieces =
    productPieces.length === 0 ||
    productPieces.every((piece) => piece.name.trim() !== "" && Number(piece.fabric) > 0 && Number(piece.color) > 0);

  // Helper function to create a new design
  const handleCreateDesign = (designName) => {
    console.log(`INVOKED CREATE DESIGN: ${designName}`);
    // This would call the API to create a new design in the database
    // For now, just log the action
  };

  // Functions for managing product pieces
  const addProductPiece = () => {
    const newPiece = {
      id: Date.now(), // Temporary id for frontend management
      name: "",
      description: "",
      fabric: 0, // Initialize as number instead of empty string
      color: 0, // Initialize as number instead of empty string
    };
    const updatedPieces = [...productPieces, newPiece];
    setProductPieces(updatedPieces);
    return updatedPieces;
  };

  const updateProductPiece = (index, field, value) => {
    const updatedPieces = [...productPieces];
    // Convert fabric and color values to numbers as required by Zod schema
    if (field === "fabric" || field === "color") {
      updatedPieces[index][field] = Number(value);
    } else {
      updatedPieces[index][field] = value;
    }
    setProductPieces(updatedPieces);
    return updatedPieces;
  };

  const removeProductPiece = (index) => {
    const updatedPieces = [...productPieces];
    updatedPieces.splice(index, 1);
    setProductPieces(updatedPieces);
    return updatedPieces;
  };

  // No need for handleImageChange as ImageUploader handles it

  // Debug logs for form validation
  console.log("Form errors:", errors);

  return (
    <>
      <form className="px-6 py-12 space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <h1 className="text-2xl font-bold mb-4">Update Product</h1>
        <div>
          <label className="block mb-2">Product Name</label>
          <input
            type="text"
            className={`border p-2 w-full ${errors.name ? "border-red-500" : ""}`}
            placeholder="Enter product name"
            {...register("name")}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block mb-2">Description</label>
          <textarea
            className={`border p-2 w-full ${errors.description ? "border-red-500" : ""}`}
            placeholder="Enter product description"
            {...register("description")}
          ></textarea>
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>
        <div>
          <label className="block mb-2">Tagline</label>
          <input
            type="text"
            className={`border p-2 w-full ${errors.tagline ? "border-red-500" : ""}`}
            placeholder="Enter product tagline"
            {...register("tagline")}
          />
          {errors.tagline && <p className="text-red-500 text-xs mt-1">{errors.tagline.message}</p>}
        </div>
        <div>
          <label className="block mb-2">Gender</label>
          <div className={`flex flex-wrap gap-2 ${errors.sex ? "border-red-500" : ""}`}>
            <Controller
              name="sex"
              control={control}
              render={({ field }) => (
                <>
                  {sexes.data.map((gender) => (
                    <button
                      key={gender.id}
                      type="button"
                      onClick={() => field.onChange(gender.id)}
                      className={`px-4 py-2 rounded-full transition-all ${
                        field.value === gender.id
                          ? "bg-blue-500 text-white ring-2 ring-blue-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      }`}
                    >
                      {gender.name.charAt(0).toUpperCase() + gender.name.slice(1)}
                      {field.value === gender.id && (
                        <svg className="inline-block ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </>
              )}
            />
          </div>
          {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex.message}</p>}
        </div>
        <div>
          <label className="block mb-2">Type of Dress</label>
          <select className={`border p-2 w-full ${errors.type ? "border-red-500" : ""}`} defaultValue="" {...register("type")}>
            <option value="" disabled>
              Make a selection
            </option>
            {types.data.map((g) => (
              <option value={g.id} key={g.id}>
                {g.name.charAt(0).toUpperCase() + g.name.slice(1)}
              </option>
            ))}
          </select>
          {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
        </div>
        <div>
          <label className="block mb-2">Brand</label>
          <select
            className={`border p-2 w-full ${errors.brand ? "border-red-500" : ""}`}
            defaultValue={brands.data.find((g) => g.name === "Nishat").id}
            {...register("brand")}
          >
            {brands.data.map((g) => (
              <option value={g.id} key={g.id}>
                {g.name.charAt(0).toUpperCase() + g.name.slice(1)}
              </option>
            ))}
          </select>
          {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand.message}</p>}
        </div>

        <div>
          <label className="block mb-2">Original Price</label>
          <input
            type="number"
            className={`border p-2 w-full ${errors.original_price ? "border-red-500" : ""}`}
            placeholder="Enter original price"
            {...register("original_price")}
          />
          {errors.original_price && <p className="text-red-500 text-xs mt-1">{errors.original_price.message}</p>}
        </div>
        <div>
          <label className="block mb-2">Discount</label>
          <input
            type="number"
            className={`border p-2 w-full ${errors.discount ? "border-red-500" : ""}`}
            placeholder="Enter discount percentage"
            {...register("discount")}
          />
          {errors.discount && <p className="text-red-500 text-xs mt-1">{errors.discount.message}</p>}
        </div>

        {/* Product Sizes and Stock Section - New UI Design */}
        <div>
          <label className="block mb-2 font-medium text-lg">Available Sizes & Quantities</label>
          <div className={`border ${errors.sizes ? "border-red-500" : "border-gray-200"} rounded-lg overflow-hidden shadow-sm`}>
            {/* Header with instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-sm text-blue-700">Select sizes available for this product and set stock quantities</span>
              </div>
            </div>

            {/* Size selection grid */}
            <div className="p-4 bg-white">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Sizes</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {sizes &&
                    sizes.data &&
                    sizes.data.map((size) => {
                      const sizeData = productSizes[size.code] || {
                        selected: false,
                        stock: 0,
                      };

                      return (
                        <label
                          key={size.code}
                          className={`
                          flex items-center justify-between px-3 py-2 rounded-lg border-2 cursor-pointer transition-all
                          ${
                            sizeData.selected
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 ring-opacity-50"
                              : "border-gray-200 hover:border-gray-300"
                          }
                        `}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={sizeData.selected}
                            onChange={() => {
                              setProductSizes((prev) => ({
                                ...prev,
                                [size.code]: {
                                  ...sizeData,
                                  selected: !sizeData.selected,
                                },
                              }));
                            }}
                          />
                          <span className="text-lg font-bold">{size.code}</span>
                          {sizeData.selected && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-blue-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Stock quantities section */}
              {Object.values(productSizes).some((size) => size.selected) ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Quantity Settings</label>
                    <span className="text-xs text-gray-500">
                      {Object.values(productSizes).filter((s) => s.selected).length} size(s) selected
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sizes &&
                          sizes.data &&
                          sizes.data.map((size) => {
                            const sizeData = productSizes[size.code] || { selected: false, stock: 0 };

                            if (!sizeData.selected) return null;

                            return (
                              <tr key={`stock-row-${size.code}`}>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="text-sm font-medium text-gray-900">{size.code}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center max-w-[120px] border gap-1">
                                    <button
                                      type="button"
                                      className="p-1 rounded-l-md bg-gray-200 hover:bg-gray-300 text-gray-700 focus:outline-none"
                                      onClick={() => {
                                        if (sizeData.stock <= 0) return;
                                        setProductSizes((prev) => ({
                                          ...prev,
                                          [size.code]: {
                                            ...sizeData,
                                            stock: sizeData.stock - 1,
                                          },
                                        }));
                                      }}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                      </svg>
                                    </button>
                                    <input
                                      type="number"
                                      id={`stock-${size.code}`}
                                      className=" border-gray-300 text-center w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      min="0"
                                      maxLength="3"
                                      value={sizeData.stock}
                                      onChange={(e) => {
                                        setProductSizes((prev) => ({
                                          ...prev,
                                          [size.code]: {
                                            ...sizeData,
                                            stock: parseInt(e.target.value) || 0,
                                          },
                                        }));
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="p-1 rounded-r-md bg-gray-200 hover:bg-gray-300 text-gray-700 focus:outline-none"
                                      onClick={() => {
                                        setProductSizes((prev) => ({
                                          ...prev,
                                          [size.code]: {
                                            ...sizeData,
                                            stock: sizeData.stock + 1,
                                          },
                                        }));
                                      }}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                  <button
                                    type="button"
                                    className="text-red-500 hover:text-red-700 focus:outline-none"
                                    onClick={() => {
                                      setProductSizes((prev) => ({
                                        ...prev,
                                        [size.code]: {
                                          ...sizeData,
                                          selected: false,
                                        },
                                      }));
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="mt-4 flex items-center justify-between text-sm bg-blue-50 p-3 rounded-md">
                    <span className="font-medium text-blue-800">
                      Total Stock: {Object.values(productSizes).reduce((acc, size) => acc + (size.selected ? size.stock : 0), 0)} units
                    </span>
                    <span className="font-medium text-blue-800">
                      {Object.values(productSizes).filter((size) => size.selected).length} sizes selected
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-md p-3 flex items-center text-yellow-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Please select at least one size for this product
                </div>
              )}
            </div>

            {errors.sizes && <div className="bg-red-50 p-2 text-red-700 text-xs">{errors.sizes.message}</div>}
          </div>
        </div>

        {/* Design Selection Section - New UI Component */}
        <div>
          <label className="block mb-2 font-medium text-lg">Design Selection</label>
          <div className={`border ${errors.designs ? "border-red-500" : "border-gray-200"} rounded-lg shadow-sm`}>
            {/* Header with instructions */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-sm text-green-700">Select one or more designs for this product</span>
              </div>
            </div>

            {/* Design selection input using ComboBox component */}
            <div className="p-4 bg-white">
              <Controller
                name="designs"
                control={control}
                render={({ field }) => (
                  <ComboBox
                    options={designs.data}
                    selectedOptions={selectedDesigns}
                    setSelectedOptions={(options) => {
                      setSelectedDesigns(options);
                      field.onChange(options);
                    }}
                    placeholder="Search designs..."
                    handleCreateOption={handleCreateDesign}
                    colorTheme="green"
                  />
                )}
              />
              {errors.designs && <p className="text-red-500 text-xs mt-1">{errors.designs.message}</p>}
            </div>
          </div>
        </div>

        {/* Product Pieces/Parts Section */}
        <div>
          <label className="block mb-2 font-medium text-lg">Product Pieces/Parts</label>
          <div className={`border ${errors.pieces ? "border-red-500" : "border-gray-200"} rounded-lg shadow-sm`}>
            {/* Header with instructions */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-sm text-purple-700">
                  Add pieces/parts that make up this product (e.g., shirt, dupatta, trouser)
                </span>
              </div>
            </div>

            <div className="p-4 bg-white">
              <Controller
                name="pieces"
                control={control}
                render={({ field }) => (
                  <>
                    {/* Existing pieces list */}
                    {productPieces.length > 0 ? (
                      <div className="mb-4 space-y-4">
                        {productPieces.map((piece, index) => (
                          <div key={piece.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium text-gray-800">Piece #{index + 1}</h4>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedPieces = removeProductPiece(index);
                                  field.onChange(updatedPieces);
                                }}
                                className="text-red-500 hover:text-red-700 focus:outline-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>

                            {/* Piece name */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Piece Name</label>
                              <input
                                type="text"
                                className={`border ${
                                  errors.pieces?.[index]?.name ? "border-red-500" : "border-gray-300"
                                } rounded-md p-2 w-full focus:ring-purple-500 focus:border-purple-500`}
                                placeholder="e.g., Shirt, Dupatta, Trouser"
                                value={piece.name}
                                onChange={(e) => {
                                  const updatedPieces = updateProductPiece(index, "name", e.target.value);
                                  field.onChange(updatedPieces);
                                }}
                              />
                              {errors.pieces?.[index]?.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.pieces[index].name.message}</p>
                              )}
                            </div>

                            {/* Piece description */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                className="border border-gray-300 rounded-md p-2 w-full focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Describe this piece..."
                                value={piece.description || ""}
                                onChange={(e) => {
                                  const updatedPieces = updateProductPiece(index, "description", e.target.value);
                                  field.onChange(updatedPieces);
                                }}
                                rows={2}
                              ></textarea>
                            </div>

                            {/* Fabric selection */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Fabric</label>
                              <select
                                className={`border ${
                                  errors.pieces?.[index]?.fabric ? "border-red-500" : "border-gray-300"
                                } rounded-md p-2 w-full focus:ring-purple-500 focus:border-purple-500`}
                                value={piece.fabric || 0}
                                onChange={(e) => {
                                  const updatedPieces = updateProductPiece(index, "fabric", e.target.value);
                                  field.onChange(updatedPieces);
                                }}
                              >
                                <option value={0}>Select a fabric</option>
                                {fabrics &&
                                  fabrics.data &&
                                  fabrics.data.map((fabric) => (
                                    <option key={fabric.id} value={fabric.id}>
                                      {fabric.name}
                                    </option>
                                  ))}
                              </select>
                              {errors.pieces?.[index]?.fabric && (
                                <p className="text-red-500 text-xs mt-1">{errors.pieces[index].fabric.message}</p>
                              )}
                            </div>

                            {/* Color selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                              <select
                                className={`border ${
                                  errors.pieces?.[index]?.color ? "border-red-500" : "border-gray-300"
                                } rounded-md p-2 w-full focus:ring-purple-500 focus:border-purple-500`}
                                value={piece.color || 0}
                                onChange={(e) => {
                                  const updatedPieces = updateProductPiece(index, "color", e.target.value);
                                  field.onChange(updatedPieces);
                                }}
                              >
                                <option value={0}>Select a color</option>
                                {colors &&
                                  colors.data &&
                                  colors.data.map((color) => (
                                    <option key={color.id} value={color.id}>
                                      {color.name}
                                    </option>
                                  ))}
                              </select>
                              {errors.pieces?.[index]?.color && (
                                <p className="text-red-500 text-xs mt-1">{errors.pieces[index].color.message}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8 bg-gray-50 border border-gray-200 border-dashed rounded-lg">
                        <div className="text-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="mx-auto h-12 w-12 text-gray-400"
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
                          <p className="mt-2 text-sm text-gray-500">No product pieces added yet</p>
                          <p className="text-xs text-gray-400">Add pieces like shirt, dupatta, trouser etc.</p>
                        </div>
                      </div>
                    )}

                    {/* Add piece button */}
                    <button
                      type="button"
                      onClick={() => {
                        addProductPiece();
                        field.onChange(productPieces);
                      }}
                      className="mt-4 flex items-center justify-center w-full py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Add Product Piece
                    </button>
                  </>
                )}
              />
              {errors.pieces && !Array.isArray(errors.pieces) && (
                <div className="bg-red-50 p-2 text-red-700 text-xs mt-2">{errors.pieces.message}</div>
              )}
              {errors.pieces && Array.isArray(errors.pieces) && errors.pieces.some((error) => error) && (
                <div className="bg-red-50 p-2 text-red-700 text-xs mt-2">Please fix all highlighted fields in product pieces</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block mb-2">Note</label>
          <textarea
            className={`border p-2 w-full ${errors.note ? "border-red-500" : ""}`}
            placeholder="Enter any additional notes"
            {...register("note")}
          ></textarea>
          {errors.note && <p className="text-red-500 text-xs mt-1">{errors.note.message}</p>}
        </div>

        {/* Product Images - New Redesigned UI with Splide Gallery and Dropzone */}
        <div>
          <label className="block mb-2 font-medium text-lg">Product Images</label>
          <ImageUploader images={images} productId={product?.id} uploadImage={uploadImage} deleteImage={deleteImage} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isValid || !hasSelectedSizes || images.length === 0}
          className={`w-full px-4 py-2 rounded transition-colors ${
            isSubmitting || !isValid || !hasSelectedSizes || images.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white`}
        >
          {isSubmitting ? "Updating..." : "Update Product"}
        </button>

        {/* Form validation summary */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
            <h3 className="text-red-800 font-medium text-sm mb-2">Please fix the following errors:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field} className="text-red-700 text-xs">
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </>
  );
};

export default UpdateProduct;
