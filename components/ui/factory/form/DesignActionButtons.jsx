"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import deleteDesign from "@/data/dal/shop/products/designs/delete-design";

export default function DesignActionButtons({ design, onEdit, onSuccess }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await deleteDesign(design.id);

      if (response.ok) {
        toast.success("Design deleted", {
          description: `Design "${design.name}" has been deleted successfully.`,
        });
        router.refresh();
        setDialogOpen(false);
        if (onSuccess && typeof onSuccess === "function") {
          onSuccess();
        }
      } else {
        toast.error("Error deleting design", {
          description: response.error || "Something went wrong.",
        });
      }
    } catch (error) {
      toast.error("Error deleting design", {
        description: error.message || "Something went wrong.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button variant="ghost" size="icon" onClick={() => onEdit(design)} className="h-8 w-8" title="Edit design">
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/20"
            title="Delete design"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the design &quot;{design.name}&quot;
              {design.product_count > 0 ? ". This design has associated products that will need to be updated." : "."}
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
