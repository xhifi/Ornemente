"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Upload, Edit } from "lucide-react";
import createOrUpdateBrand from "@/data/dal/shop/products/brands/create-or-update-brand";
import Image from "next/image";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";

export default function BrandSheet({ brand = null, children }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(brand?.name || "");
  const [image, setImage] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(brand?.image_url || null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();
  const fileInputRef = React.useRef(null);

  const isEditing = !!brand;

  React.useEffect(() => {
    if (open) {
      setName(brand?.name || "");
      setImage(null);
      setImagePreview(brand?.image_url || null);
    }
  }, [open, brand]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Brand name is required");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("name", name);
      if (brand?.id) {
        formData.append("id", brand.id);
      }
      if (image) {
        formData.append("image", image);
      }

      const response = await createOrUpdateBrand(formData);

      if (response.ok) {
        toast.success(`Brand "${name}" ${brand ? "updated" : "created"} successfully`);
        revalidatePathSSR("/dashboard/products/brands");
        router.refresh();
        setOpen(false);
      } else {
        toast.error(`Failed to ${brand ? "update" : "create"} brand: ${response.error}`);
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!isSubmitting) {
      setOpen(newOpen);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild className={isEditing ? "" : ""}>
        {isEditing ? (
          <button className="hover:bg-primary/10 p-1 rounded">
            <Edit size={16} />
          </button>
        ) : (
          children || <button onClick={() => setOpen(true)}>Create Brand</button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit" : "Create"} Brand</SheetTitle>
          <SheetDescription>
            {isEditing ? "Update this brand's details below." : "Create a new brand for your products. You can add a logo and brand name."}
          </SheetDescription>
        </SheetHeader>

        <form className="space-y-6 mt-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="brand-name" className="block mb-2">
              Brand Name
            </Label>
            <Input
              id="brand-name"
              name="brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter brand name"
              disabled={isSubmitting}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">Enter a brand name like 'Nike', 'Adidas', 'Apple', etc.</p>
          </div>

          <div>
            <Label className="block mb-2">Brand Logo</Label>
            <p className="text-xs text-muted-foreground mb-3">Upload a logo for this brand (optional)</p>

            <input
              type="file"
              id="brand-image"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />

            <div className="flex flex-col items-center gap-4">
              {imagePreview ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-md border-2 border-gray-200">
                  <Image src={imagePreview} alt="Brand logo preview" fill className="object-contain" />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-muted-foreground bg-gray-50">
                  <span className="text-xs">No Logo</span>
                </div>
              )}

              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                <Upload className="mr-2 h-4 w-4" />
                {imagePreview ? "Change Logo" : "Upload Logo"}
              </Button>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update" : "Create") + " Brand"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

BrandSheet.displayName = "BrandSheet";
