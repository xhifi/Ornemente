"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";

import createPermission from "@/data/dal/auth/permissions/create-permission";
import updatePermission from "@/data/dal/auth/permissions/update-permission";
import assignResourcesToPermission from "@/data/dal/auth/permissions/assign-resources-to-permission";
import { toast } from "sonner";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getServerSession } from "@/lib/auth-actions";

const PermissionSheet = ({ permission, availableResources = [] }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    selectedResources: new Set(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isEditing = !!permission;

  // Reset form when sheet opens/closes or permission changes
  useEffect(() => {
    if (open) {
      if (isEditing && permission) {
        const resourceIds = permission.resources ? new Set(permission.resources.map((r) => r.resource_id)) : new Set();

        setFormData({
          name: permission.name || "",
          selectedResources: resourceIds,
        });
      } else {
        setFormData({
          name: "",
          selectedResources: new Set(),
        });
      }
    }
  }, [open, isEditing, permission]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResourceToggle = (resourceId) => {
    const newSelected = new Set(formData.selectedResources);
    if (newSelected.has(resourceId)) {
      newSelected.delete(resourceId);
    } else {
      newSelected.add(resourceId);
    }
    setFormData((prev) => ({
      ...prev,
      selectedResources: newSelected,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!formData.name.trim()) {
        toast.error("Please enter a permission name");
        return;
      }

      let response;
      let permissionId;
      if (isEditing) {
        response = await updatePermission({
          permissionId: permission.id,
          name: formData.name.trim(),
        });
        permissionId = permission.id;
      } else {
        response = await createPermission({
          name: formData.name.trim(),
        });
        permissionId = response.permission?.id;
      }

      if (response.success) {
        // Always try to assign/update resource associations (even if empty)
        if (permissionId) {
          console.log("About to assign resources:", {
            permissionId,
            selectedResources: Array.from(formData.selectedResources),
            responsePermission: response.permission,
          });
          const session = await getServerSession();
          console.log(session);
          const resourceResponse = await assignResourcesToPermission({
            permissionId: permissionId,
            resourceIds: Array.from(formData.selectedResources),
            assigned_by: session?.user?.id || null, // Replace with actual user ID or context
          });

          if (!resourceResponse.success) {
            toast.warning(
              `Permission ${isEditing ? "updated" : "created"} but failed to update resource associations: ${resourceResponse.error}`
            );
          }
        } else {
          console.error("No permission ID available for resource assignment");
        }

        toast.success(`Permission ${isEditing ? "updated" : "created"} successfully!`);

        // Revalidate pages
        revalidatePathSSR("/dashboard/users/permissions");
        revalidatePathSSR("/dashboard/users/roles");

        // Force refresh to show updated data
        router.refresh();

        setOpen(false);
      } else {
        toast.error(response.error || "Something went wrong");
      }
    } catch (error) {
      toast.error(`Error ${isEditing ? "updating" : "creating"} permission: ${error.message}`);
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
            Create Permission
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Permission" : "Create New Permission"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the permission details below."
              : "Add a new permission to the system (e.g., 'Create User', 'Read Products', 'Update Orders')."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Permission Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Create User, Read Products, Update Orders"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter a descriptive permission name like 'Create User', 'Read Products', or 'Delete Orders'
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Associated Resources (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select which resources this permission can be applied to. You can also manage this later through the roles interface.
            </p>

            <ScrollArea className="h-[200px] w-full border rounded-md p-4">
              {availableResources.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No resources available. Create some resources first.</p>
              ) : (
                <div className="space-y-3">
                  {availableResources.map((resource) => (
                    <div key={resource.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`resource-${resource.id}`}
                        checked={formData.selectedResources.has(resource.id)}
                        onCheckedChange={() => handleResourceToggle(resource.id)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor={`resource-${resource.id}`} className="flex-1 cursor-pointer">
                        <span className="font-medium">{resource.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="text-sm text-muted-foreground">
              Selected: {formData.selectedResources.size} resource{formData.selectedResources.size !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default PermissionSheet;
