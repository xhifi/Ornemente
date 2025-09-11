"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import createProduct from "@/data/dal/shop/products/create-product";
import { Plus } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Zod schema for form validation
const zodSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Product name must be less than 255 characters"),
  description: z.string().optional(),
  variant: z.coerce.number().positive("Variant selection is required"),
});

const AddProductSheet = ({ variants, buttonText = "Add Product" }) => {
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
      variant: "", // Will be set after variants are loaded
    },
  });

  const watchVariant = watch("variant");

  // Set default variant when variants data is loaded
  useEffect(() => {
    if (variants?.data?.length > 0) {
      // Find women or take the first option
      const defaultVariant = variants.data.find((g) => g.name.toLowerCase() === "women") || variants.data[0];
      if (defaultVariant) {
        setValue("variant", defaultVariant.id);
      }
    }
  }, [variants, setValue]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Convert variant to number to ensure it's sent as a number
      const variantValue = parseInt(data.variant, 10);

      // Create the product with minimal information using the server action
      const result = await createProduct({
        name: data.name,
        description: data.description || null,
        variant: variantValue,
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button>
          {!buttonText.includes("First") && <Plus className="mr-2 h-4 w-4" />}
          {buttonText}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Create New Product</SheetTitle>
          <SheetDescription>
            Start by creating a basic product entry. You can add more details, images, and variants later.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name*</Label>
              <Input
                id="name"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
                placeholder="Enter product name"
                disabled={isSubmitting}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                className={errors.description ? "border-red-500" : ""}
                placeholder="Enter product description (optional)"
                rows={3}
                disabled={isSubmitting}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div>
              <Label className="block mb-2">Variant*</Label>
              <div className="flex flex-wrap gap-2">
                {variants?.data?.length > 0 ? (
                  variants.data.map((variantOption) => (
                    <label
                      key={variantOption.id}
                      className={`px-4 py-2 rounded-full cursor-pointer transition-all ${
                        Number(watchVariant) === variantOption.id
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                          : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        value={variantOption.id}
                        disabled={isSubmitting}
                        {...register("variant", { valueAsNumber: true })}
                      />
                      {variantOption.name.charAt(0).toUpperCase() + variantOption.name.slice(1)}
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Loading variant options...</div>
                )}
              </div>
              {errors.variant && <p className="mt-1 text-xs text-red-500">{errors.variant.message}</p>}
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Creating..." : "Create & Continue"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddProductSheet;
