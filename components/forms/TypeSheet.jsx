"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import createProductType from "@/data/dal/shop/types/create-product-type";
import { toast } from "sonner";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const TypeSheet = ({ type }) => {
  const [open, setOpen] = useState(false);
  const [typeName, setTypeName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isEditing = !!type;

  // Initialize form with existing data if in edit mode
  useEffect(() => {
    if (open) {
      if (type) {
        setTypeName(type.name || "");
      } else {
        setTypeName("");
      }
    }
  }, [type, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate input
    if (!typeName.trim()) {
      toast.error("Type name is required");
      setIsSubmitting(false);
      return;
    }

    try {
      // Call the API function with type ID if in edit mode
      const response = await createProductType(typeName.trim(), isEditing ? type.id : null);

      if (response.ok) {
        revalidatePathSSR("/dashboard/products/types");
        revalidatePathSSR("/dashboard/products");

        toast.success(isEditing ? `Type "${typeName}" updated successfully` : `Type "${typeName}" created successfully`);
        setOpen(false);
        if (!isEditing) {
          setTypeName("");
        }
        router.refresh();
      } else {
        toast.error(`Failed to ${isEditing ? "update" : "create"} type: ${response.error}`);
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
    <Sheet onOpenChange={handleOpenChange} open={open}>
      <SheetTrigger
        asChild
        className={isEditing ? "" : "ms-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer px-3 py-1.5"}
      >
        {isEditing ? (
          <button className="hover:bg-primary/10 p-1 rounded">
            <Edit size={16} />
          </button>
        ) : (
          <button onClick={() => setOpen(true)}>Create Type</button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit" : "Create"} Product Type</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the type details below. The slug will be automatically updated."
              : "Create a new product type. The slug will be automatically generated based on the name."}
          </SheetDescription>
        </SheetHeader>

        <form className="space-y-6 mt-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="type-name" className="block mb-2">
              Type Name
            </Label>
            <Input
              id="type-name"
              name="type-name"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="Enter a unique type name"
              disabled={isSubmitting}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">Enter a type name like 'Stitched', 'Un-stitched', 'Ready to wear', etc.</p>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update" : "Create") + " Type"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

TypeSheet.displayName = "TypeSheet";
export default TypeSheet;
