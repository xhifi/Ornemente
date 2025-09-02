"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";
import deleteDesign from "@/data/dal/shop/products/designs/delete-design";
import DesignSheet from "@/components/forms/DesignSheet";

export default function DesignActionButtons({ design, canUpdate, canDelete }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the design "${design.name}"? This action cannot be undone and will affect all related products.`
      )
    ) {
      return;
    }

    try {
      const response = await deleteDesign(design.id);

      if (response.ok) {
        toast.success("Design deleted successfully!");
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete design");
      }
    } catch (error) {
      toast.error(`Error deleting design: ${error.message}`);
    }
  };

  return (
    <span className="flex items-center">
      {canUpdate ? (
        <DesignSheet design={design} />
      ) : (
        <span className="text-muted-foreground opacity-50 p-1">
          <Edit size={16} />
        </span>
      )}
      <div className="h-full w-2 bg-black inline-block" />
      {canDelete ? (
        <button className="text-destructive hover:bg-destructive/10 p-1 rounded" onClick={handleDelete}>
          <Trash2 size={16} />
        </button>
      ) : (
        <span className="text-muted-foreground opacity-50 p-1">
          <Trash2 size={16} />
        </span>
      )}
    </span>
  );
}
