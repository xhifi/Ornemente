"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Upload } from "lucide-react";
import createOrUpdateBrand from "@/data/dal/shop/products/brands/create-or-update-brand";
import Image from "next/image";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";

export default function BrandDialog({ brand = null, children, open, onOpenChange, onSuccess }) {
  // If open/onOpenChange are provided, use them. Otherwise use internal state
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange : setInternalOpen;

  const [name, setName] = React.useState(brand?.name || "");
  const [image, setImage] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(brand?.image_url || null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    if (dialogOpen) {
      setName(brand?.name || "");
      setImage(null);
      setImagePreview(brand?.image_url || null);
    }
  }, [dialogOpen, brand]);

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
      toast.error("Error", {
        description: "Brand name is required",
      });
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
        toast.success(`Brand ${brand ? "updated" : "created"}`, {
          description: `Brand "${name}" has been ${brand ? "updated" : "created"} successfully.`,
        });
        revalidatePathSSR("/dashboard/products/brands");
        router.refresh();
        setDialogOpen(false);
        if (onSuccess && typeof onSuccess === "function") {
          onSuccess();
        }
      } else {
        toast.error(`Error ${brand ? "updating" : "creating"} brand`, {
          description: response.error || "Something went wrong.",
        });
      }
    } catch (error) {
      toast.error(`Error ${brand ? "updating" : "creating"} brand`, {
        description: error.message || "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{brand ? "Edit Brand" : "Create Brand"}</DialogTitle>
            <DialogDescription>{brand ? "Update this brand's details" : "Create a new brand for your products"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Brand name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Logo
              </Label>
              <div className="col-span-3">
                <input type="file" id="image" ref={fileInputRef} accept="image/*" onChange={handleImageChange} className="hidden" />

                <div className="flex flex-col items-center gap-4">
                  {imagePreview ? (
                    <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                      <Image src={imagePreview} alt="Brand logo preview" fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                      No image
                    </div>
                  )}

                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="mt-2">
                    <Upload className="mr-2 h-4 w-4" />
                    {imagePreview ? "Change Image" : "Upload Image"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {brand ? (isSubmitting ? "Saving..." : "Save changes") : isSubmitting ? "Creating..." : "Create brand"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
