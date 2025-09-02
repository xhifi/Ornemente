"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import deleteProductByID from "@/data/dal/shop/products/delete-product-by-id";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function DeleteProductSheet({ productId, productName, children }) {
  const [open, setOpen] = useState(false);
  const onOpenChange = (isOpen) => setOpen(isOpen);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteProductByID(productId);

      if (result.error) {
        console.error("Error deleting product:", result.error);
        alert("Failed to delete product: " + (result.error || "Unknown error"));
        setIsDeleting(false);
        return;
      }

      // Close the sheet and refresh the page
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button className="text-destructive hover:bg-destructive/10 p-1 rounded">{children}</button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Delete Product</SheetTitle>
          <SheetDescription>This action cannot be undone. The product will be permanently removed from the system.</SheetDescription>
        </SheetHeader>

        <div className="py-6">
          <p className="text-center">
            Are you sure you want to delete the product
            <span className="font-medium">{productName ? ` "${productName}"` : ""}</span>?
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
        </div>

        <SheetFooter className="flex space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting} className="flex-1">
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1">
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
