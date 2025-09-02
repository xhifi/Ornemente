"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";
import deleteSize from "@/data/dal/shop/products/sizes/delete-size";
import SizeSheet from "@/components/forms/SizeSheet";

export default function SizeActionButtons({ size, canUpdate, canDelete }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the size "${size.code} (${size.label})"? This action cannot be undone and will affect all related products.`
      )
    ) {
      return;
    }

    try {
      const response = await deleteSize(size.code);

      if (response.ok) {
        toast.success("Size deleted successfully!");
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete size");
      }
    } catch (error) {
      toast.error(`Error deleting size: ${error.message}`);
    }
  };

  return (
    <span className="flex items-center">
      {canUpdate ? (
        <SizeSheet size={size} />
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
