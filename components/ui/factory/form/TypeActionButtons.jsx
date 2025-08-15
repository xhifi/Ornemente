"use client";
import deleteProductType from "@/data/dal/shop/types/delete-product-type";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import TypeDialog from "@/components/forms/TypeDialog";

const TypeActionButtons = ({ type }) => {
  const router = useRouter();

  if (!type) {
    return <span>No type provided</span>;
  }

  const handleDelete = async () => {
    const deleted = await deleteProductType(type.id);
    if (deleted.ok) {
      revalidatePathSSR("/dashboard/products/types");
      revalidatePathSSR("/dashboard/products");
      router.refresh();
      return toast.success(`Type ${type.name} Deleted Successfully`);
    } else {
      return toast.error(`Error deleting product type: ${deleted.error}`);
    }
  };

  //   const handleRevalidate = () => {
  //     revalidatePathSSR("/dashboard/products/types");
  //     router.refresh();
  //   };

  return (
    <span className="flex items-center">
      <TypeDialog type={type} />
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

export default TypeActionButtons;
