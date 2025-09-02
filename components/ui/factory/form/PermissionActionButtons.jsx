"use client";

import PermissionSheet from "@/components/forms/PermissionSheet";
import deletePermission from "@/data/dal/auth/permissions/delete-permission";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const PermissionActionButtons = ({ permission, availableResources = [] }) => {
  const router = useRouter();

  if (!permission) {
    return <span>No permission provided</span>;
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the permission "${permission.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await deletePermission({ permissionId: permission.id });

      if (response.success) {
        toast.success("Permission deleted successfully!");

        // Revalidate pages
        revalidatePathSSR("/dashboard/users/permissions");
        revalidatePathSSR("/dashboard/users/roles");

        // Force refresh the page to show updated data
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete permission");
      }
    } catch (error) {
      toast.error(`Error deleting permission: ${error.message}`);
    }
  };

  return (
    <span className="flex items-center">
      <PermissionSheet permission={permission} availableResources={availableResources} />
      <div className="h-full w-2 bg-black inline-block" />
      <button className="text-destructive hover:bg-destructive/10 p-1 rounded" onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
      </button>
    </span>
  );
};

export default PermissionActionButtons;
