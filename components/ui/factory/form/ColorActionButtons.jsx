"use client";
import ColorDialog from "@/components/forms/ColorDialog";
import deleteProductColor from "@/data/dal/shop/products/actions/colors/delete-product-color";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ColorActionButtons = ({ color }) => {
  const router = useRouter();

  if (!color) {
    return <span>No color provided</span>;
  }

  const handleEdit = () => {
    // Logic for editing the color can be added here
    toast.info(`Edit functionality for color ${color.name} is not implemented yet.`);
    // You can redirect to an edit page or open a modal here
  };

  const handleDelete = async () => {
    const deleted = await deleteProductColor(color.id);
    if (deleted.ok) {
      revalidatePathSSR("/dashboard/products/colors");
      revalidatePathSSR("/dashboard/products");
      router.refresh();
      return toast.success(`Color ${color.name} Deleted Successfully`);
    } else {
      return toast.error(`Error deleting product color: ${deleted.error}`);
    }
  };

  const handleRevalidate = () => {
    revalidatePathSSR("/dashboard/products/colors");
    router.refresh();
  };

  return (
    <span className="flex items-center">
      <ColorDialog color={color} />
      <div className="h-full w-2 bg-black inline-block" />
      <button className="text-destructive hover:underline underline-offset-3" onClick={handleDelete}>
        Delete
      </button>
      {/* <button className="text-purple-500" onClick={handleRevalidate}>
        REVALIDATE
      </button> */}
    </span>
  );
};

export default ColorActionButtons;
