"use client";
import deleteRole from "@/data/dal/auth/roles/delete-role";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import RoleSheet from "@/components/forms/RoleSheet";
import { Trash2 } from "lucide-react";

const RoleActionButtons = ({ role, availablePermissions = [] }) => {
  const router = useRouter();

  if (!role) {
    return <span>No role provided</span>;
  }

  const handleDelete = async () => {
    // Add confirmation for important roles
    if (role.priority <= 10) {
      const confirmed = window.confirm(
        `Are you sure you want to delete the high-priority role "${role.name}"? This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    try {
      const deleted = await deleteRole({ roleId: role.id });

      if (deleted.success) {
        revalidatePathSSR("/dashboard/users/roles");
        revalidatePathSSR("/dashboard/users");
        router.refresh();
        return toast.success(`Role "${role.name}" deleted successfully`);
      } else {
        return toast.error(`Error deleting role: ${deleted.error}`);
      }
    } catch (error) {
      return toast.error(`Error deleting role: ${error.message}`);
    }
  };

  return (
    <span className="flex items-center">
      <RoleSheet role={role} availablePermissions={availablePermissions} />
      <div className="h-full w-2 bg-black inline-block" />
      <button
        className={`text-destructive hover:bg-destructive/10 p-1 rounded ${role.name === "super_admin" ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleDelete}
        disabled={role.name === "super_admin"} // Prevent deleting super admin
        title={role.name === "super_admin" ? "Cannot delete super admin role" : ""}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </span>
  );
};

export default RoleActionButtons;
