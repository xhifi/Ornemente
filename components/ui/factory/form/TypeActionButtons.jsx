"use client";

import TypeSheet from "@/components/forms/TypeSheet";
import deleteProductType from "@/data/dal/shop/types/delete-product-type";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { Trash2Icon, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const TypeActionButtons = ({ type, canUpdate, canDelete }) => {
  const router = useRouter();

  if (!type) {
    return <span>No type provided</span>;
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the type "${type.name}"? This action cannot be undone and will affect all related products.`
      )
    ) {
      return;
    }

    try {
      const response = await deleteProductType(type.id);

      if (response.ok) {
        toast.success("Type deleted successfully!");

        // Revalidate pages
        revalidatePathSSR("/dashboard/products/types");
        revalidatePathSSR("/dashboard/products");

        // Force refresh the page to show updated data
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete type");
      }
    } catch (error) {
      toast.error(`Error deleting type: ${error.message}`);
    }
  };

  return (
    <span className="flex items-center">
      {canUpdate ? (
        <TypeSheet type={type} />
      ) : (
        <span className="text-muted-foreground opacity-50 p-1">
          <Edit size={16} />
        </span>
      )}
      <div className="h-full w-2 bg-black inline-block" />
      {canDelete ? (
        <button className="text-destructive hover:bg-destructive/10 p-1 rounded" onClick={handleDelete}>
          <Trash2Icon size={16} />
        </button>
      ) : (
        <span className="text-muted-foreground opacity-50 p-1">
          <Trash2Icon size={16} />
        </span>
      )}
    </span>
  );
};

export default TypeActionButtons;
