"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import createProductType from "@/data/dal/shop/types/create-product-type";
import { toast } from "sonner";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useState, useEffect } from "react";

const TypeDialog = ({ type }) => {
  const [open, setOpen] = useState(false);
  const [typeName, setTypeName] = useState("");
  const isEditMode = !!type;

  // Initialize form with existing data if in edit mode
  useEffect(() => {
    if (type) {
      setTypeName(type.name || "");
    }
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    if (!typeName.trim()) {
      return toast.error("Type name is required");
    }

    try {
      // Call the API function with type ID if in edit mode
      const response = await createProductType(typeName.trim(), isEditMode ? type.id : null);

      if (response.ok) {
        revalidatePathSSR("/dashboard/products/types");
        toast.success(isEditMode ? `Type updated successfully to ${typeName}` : `Type ${typeName} created successfully`);
        setOpen(false);
        setTypeName("");
      } else {
        toast.error(`Failed to ${isEditMode ? "update" : "create"} type: ${response.error}`);
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    }
  };

  return (
    <Dialog className={isEditMode ? "" : "ms-auto"} onOpenChange={setOpen} open={open}>
      <DialogTrigger
        asChild
        className={isEditMode ? "" : "ms-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer px-3 py-1.5"}
      >
        {isEditMode ? (
          <button className="hover:underline underline-offset-3">Edit</button>
        ) : (
          <button onClick={() => setOpen(true)}>Create Type</button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit" : "Create"} Product Type</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the type details below. The slug will be automatically updated."
              : "The slug will be automatically generated based on the name you provide"}
          </DialogDescription>

          <form className="space-y-2 mt-3" onSubmit={handleSubmit}>
            <Label htmlFor="type-name" className="block mb-2">
              Type Name
            </Label>
            <Input
              id="type-name"
              name="type-name"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="Enter a unique type name"
              className="mb-4"
            />
            <Button type="submit" className="w-full">
              {isEditMode ? "Update" : "Create"} Type
            </Button>
          </form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

TypeDialog.displayName = "TypeDialog";
export default TypeDialog;
