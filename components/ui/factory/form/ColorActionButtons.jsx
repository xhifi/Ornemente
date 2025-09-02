"use client";

import ColorSheet from "@/components/forms/ColorSheet";
import deleteProductColor from "@/data/dal/shop/products/actions/colors/delete-product-color";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { Trash2Icon, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ColorActionButtons = ({ color, canUpdate, canDelete }) => {
  const router = useRouter();

  if (!color) {
    return <span>No color provided</span>;
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the color "${color.name}"? This action cannot be undone and will affect all related products.`
      )
    ) {
      return;
    }

    try {
      const response = await deleteProductColor(color.id);

      if (response.ok) {
        toast.success("Color deleted successfully!");

        // Revalidate pages
        revalidatePathSSR("/dashboard/products/colors");
        revalidatePathSSR("/dashboard/products");

        // Force refresh the page to show updated data
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete color");
      }
    } catch (error) {
      toast.error(`Error deleting color: ${error.message}`);
    }
  };

  return (
    <span className="flex items-center">
      {canUpdate ? (
        <ColorSheet color={color} />
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

export default ColorActionButtons;
