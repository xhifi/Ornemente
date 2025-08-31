"use client";

import ResourceDialog from "@/components/forms/ResourceDialog";
import deleteResource from "@/data/dal/auth/resources/delete-resource";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ResourceActionButtons = ({ resource }) => {
  const router = useRouter();

  if (!resource) {
    return <span>No resource provided</span>;
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the resource "${resource.name}"? This action cannot be undone and will affect all related permissions.`
      )
    ) {
      return;
    }

    try {
      const response = await deleteResource({ resourceId: resource.id });

      if (response.success) {
        toast.success("Resource deleted successfully!");

        // Revalidate pages
        revalidatePathSSR("/dashboard/users/resources");
        revalidatePathSSR("/dashboard/users/roles");
        revalidatePathSSR("/dashboard/users/permissions");

        // Force refresh the page to show updated data
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete resource");
      }
    } catch (error) {
      toast.error(`Error deleting resource: ${error.message}`);
    }
  };

  return (
    <span className="flex items-center">
      <ResourceDialog resource={resource} />
      <div className="h-full w-2 bg-black inline-block" />
      <button className="text-destructive hover:underline underline-offset-3" onClick={handleDelete}>
        Delete
      </button>
    </span>
  );
};

export default ResourceActionButtons;
