"use client";

import BrandSheet from "@/components/forms/BrandSheet";
import deleteBrand from "@/data/dal/shop/products/brands/delete-brand";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { Trash2Icon, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const BrandActionButtons = ({ brand, canUpdate, canDelete }) => {
  const router = useRouter();

  if (!brand) {
    return <span>No brand provided</span>;
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the brand "${brand.name}"? This action cannot be undone and will affect all related products.`
      )
    ) {
      return;
    }

    try {
      const response = await deleteBrand(brand.id);

      if (response.ok) {
        toast.success("Brand deleted successfully!");

        // Revalidate pages
        revalidatePathSSR("/dashboard/products/brands");
        revalidatePathSSR("/dashboard/products");

        // Force refresh the page to show updated data
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete brand");
      }
    } catch (error) {
      toast.error(`Error deleting brand: ${error.message}`);
    }
  };

  return (
    <span className="flex items-center">
      {canUpdate ? (
        <BrandSheet brand={brand} />
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

export default BrandActionButtons;
