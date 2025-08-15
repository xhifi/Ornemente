"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import deleteBrand from "@/data/dal/shop/products/brands/delete-brand";

export default function BrandActionButtons({ brand, onEdit, onSuccess }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await deleteBrand(brand.id);

      if (response.ok) {
        toast.success("Brand deleted", {
          description: `Brand "${brand.name}" has been deleted successfully.`,
        });
        router.refresh();
        setDialogOpen(false);
        if (onSuccess && typeof onSuccess === "function") {
          onSuccess();
        }
      } else {
        toast.error("Error deleting brand", {
          description: response.error || "Something went wrong.",
        });
      }
    } catch (error) {
      toast.error("Error deleting brand", {
        description: error.message || "Something went wrong.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button variant="ghost" size="icon" onClick={() => onEdit(brand)} className="h-8 w-8" title="Edit brand">
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/20"
            title="Delete brand"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the brand &quot;{brand.name}&quot;
              {brand.product_count > 0 ? ". This brand has associated products that will need to be updated." : "."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
