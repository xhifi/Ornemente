"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/data/dal/shop/products/product-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export default function DeleteProductDialog({ productId, productName }) {
  const [open, setOpen] = useState(false);
  const onOpenChange = (isOpen) => setOpen(isOpen);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteProduct(productId);

      if (result.error) {
        console.error("Error deleting product:", result.error);
        alert("Failed to delete product: " + (result.error || "Unknown error"));
        setIsDeleting(false);
        return;
      }

      // Close the dialog and refresh the page
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="text-red-600 hover:text-red-900">Delete</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <p className="text-center">
            Are you sure you want to delete the product
            <span className="font-medium">{productName ? ` "${productName}"` : ""}</span>?
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">This action cannot be undone.</p>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
