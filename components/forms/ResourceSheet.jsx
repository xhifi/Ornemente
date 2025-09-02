"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";

import createResource from "@/data/dal/auth/resources/create-resource";
import updateResource from "@/data/dal/auth/resources/update-resource";
import { toast } from "sonner";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ResourceSheet = ({ resource }) => {
  const [open, setOpen] = useState(false);
  const [resourceName, setResourceName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isEditing = !!resource;

  // Initialize form with existing data if in edit mode
  useEffect(() => {
    if (open) {
      if (resource) {
        setResourceName(resource.name || "");
      } else {
        setResourceName("");
      }
    }
  }, [resource, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate input
    if (!resourceName.trim()) {
      toast.error("Resource name is required");
      setIsSubmitting(false);
      return;
    }

    try {
      let response;

      if (isEditing) {
        // Update existing resource
        response = await updateResource({
          resourceId: resource.id,
          name: resourceName.trim(),
        });
      } else {
        // Create new resource
        response = await createResource({
          name: resourceName.trim(),
        });
      }

      if (response.success) {
        revalidatePathSSR("/dashboard/users/resources");
        revalidatePathSSR("/dashboard/users/roles");
        revalidatePathSSR("/dashboard/users/permissions");

        toast.success(isEditing ? `Resource "${resourceName}" updated successfully` : `Resource "${resourceName}" created successfully`);
        setOpen(false);
        if (!isEditing) {
          setResourceName("");
        }
        router.refresh();
      } else {
        toast.error(`Failed to ${isEditing ? "update" : "create"} resource: ${response.error}`);
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!isSubmitting) {
      setOpen(newOpen);
    }
  };

  return (
    <Sheet onOpenChange={handleOpenChange} open={open}>
      <SheetTrigger asChild>
        {isEditing ? (
          <button className="hover:bg-muted p-1 rounded">
            <Edit className="h-4 w-4" />
          </button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Resource
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit" : "Create"} Resource</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the resource details below."
              : "Create a new resource for the system (e.g., 'products', 'orders', 'users')."}
          </SheetDescription>
        </SheetHeader>

        <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="resource-name" className="block mb-2">
              Resource Name
            </Label>
            <Input
              id="resource-name"
              name="resource-name"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              placeholder="Enter a unique resource name (e.g., products, orders, users)"
              disabled={isSubmitting}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">Enter a resource name like 'products', 'orders', 'users', 'categories', etc.</p>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update" : "Create") + " Resource"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

ResourceSheet.displayName = "ResourceSheet";
export default ResourceSheet;
