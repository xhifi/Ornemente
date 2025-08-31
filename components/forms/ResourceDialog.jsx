"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import createResource from "@/data/dal/auth/resources/create-resource";
import updateResource from "@/data/dal/auth/resources/update-resource";
import { toast } from "sonner";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ResourceDialog = ({ resource }) => {
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
    <Dialog className={isEditing ? "" : "ms-auto"} onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        asChild
        className={isEditing ? "" : "ms-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer px-3 py-1.5"}
      >
        {isEditing ? (
          <button className="hover:underline underline-offset-3">Edit</button>
        ) : (
          <button onClick={() => setOpen(true)}>Create Resource</button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Create"} Resource</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the resource details below."
              : "Create a new resource for the system (e.g., 'products', 'orders', 'users')."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 mt-3" onSubmit={handleSubmit}>
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
      </DialogContent>
    </Dialog>
  );
};

ResourceDialog.displayName = "ResourceDialog";
export default ResourceDialog;
