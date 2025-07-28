"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createProduct } from "@/data/dal/shop/products/product-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

// Zod schema for form validation
const zodSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Product name must be less than 255 characters"),
  description: z.string().optional(),
  sex: z.coerce.number().positive("Gender selection is required"),
});

export default function AddProductDialog({ sexes, buttonText = "Add Product" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onOpenChange = (isOpen) => setOpen(isOpen);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: {
      name: "",
      description: "",
      sex: "", // Will be set after sexes are loaded
    },
  });

  const watchSex = watch("sex");

  // Set default gender when sexes data is loaded
  useEffect(() => {
    if (sexes?.data?.length > 0) {
      // Find women or take the first option
      const defaultSex = sexes.data.find((g) => g.name.toLowerCase() === "women") || sexes.data[0];
      if (defaultSex) {
        setValue("sex", defaultSex.id);
      }
    }
  }, [sexes, setValue]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Convert sex to number to ensure it's sent as a number
      const sexValue = parseInt(data.sex, 10);

      // Create the product with minimal information using the server action
      const result = await createProduct({
        name: data.name,
        description: data.description || null,
        sex: sexValue,
        publish_status: "draft",
      });

      if (result.error) {
        console.error("Error creating product:", result.error);
        alert("Failed to create product: " + (result.error || "Unknown error"));
        setIsSubmitting(false);
        return;
      }

      // Reset form and close modal
      reset();
      onOpenChange(false);

      // Redirect to the product edit page
      router.push(`/dashboard/products/${result.productId}/edit`);
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center">
          {!buttonText.includes("First") && (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
          {buttonText}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium">
                Product Name*
              </label>
              <input
                id="name"
                {...register("name")}
                className={`border rounded-md w-full p-2 ${errors.name ? "border-red-500" : "border-gray-300"}`}
                placeholder="Enter product name"
                disabled={isSubmitting}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block mb-2 text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                {...register("description")}
                className={`border rounded-md w-full p-2 ${errors.description ? "border-red-500" : "border-gray-300"}`}
                placeholder="Enter product description (optional)"
                rows={3}
                disabled={isSubmitting}
              ></textarea>
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Gender*</label>
              <div className="flex flex-wrap gap-2">
                {sexes?.data?.length > 0 ? (
                  sexes.data.map((gender) => (
                    <label
                      key={gender.id}
                      className={`px-4 py-2 rounded-full cursor-pointer transition-all ${
                        Number(watchSex) === gender.id
                          ? "bg-blue-500 text-white ring-2 ring-blue-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        value={gender.id}
                        disabled={isSubmitting}
                        {...register("sex", { valueAsNumber: true })}
                      />
                      {gender.name.charAt(0).toUpperCase() + gender.name.slice(1)}
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Loading gender options...</div>
                )}
              </div>
              {errors.sex && <p className="mt-1 text-xs text-red-500">{errors.sex.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create & Continue"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
