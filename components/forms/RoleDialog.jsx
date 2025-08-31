"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import createRole from "@/data/dal/auth/roles/create-role";
import updateRole from "@/data/dal/auth/roles/update-role";
import assignPermissionsToRole from "@/data/dal/auth/permissions/assign-permissions-to-role";
import getRolePermissions from "@/data/dal/auth/permissions/get-role-permissions";
import { toast } from "sonner";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useState, useEffect } from "react";

const RoleDialog = ({ role, availablePermissions = [] }) => {
  const [open, setOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [priority, setPriority] = useState(100);
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const isEditMode = !!role;

  // Initialize form with existing data if in edit mode
  useEffect(() => {
    if (open) {
      if (role) {
        setRoleName(role.name || "");
        setPriority(role.priority || 100);
        // Load existing permissions for the role
        loadRolePermissions();
      } else {
        setRoleName("");
        setPriority(100);
        setSelectedPermissions(new Set());
      }
    }
  }, [role, open]);

  const loadRolePermissions = async () => {
    if (!role) return;

    try {
      const response = await getRolePermissions({ roleId: role.id });
      if (response.success && response.permissions) {
        const permissionIds = new Set(response.permissions.map((p) => p.id));
        setSelectedPermissions(permissionIds);
      }
    } catch (error) {
      console.error("Error loading role permissions:", error);
    }
  };

  const handlePermissionToggle = (permissionId) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate input
    if (!roleName.trim()) {
      toast.error("Role name is required");
      setIsSubmitting(false);
      return;
    }

    if (priority < 1 || priority > 999) {
      toast.error("Priority must be between 1 and 999");
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      let roleId;

      if (isEditMode) {
        // Update existing role
        response = await updateRole({
          roleId: role.id,
          name: roleName.trim(),
          priority: parseInt(priority),
        });
        roleId = role.id;
      } else {
        // Create new role
        response = await createRole({
          name: roleName.trim(),
          priority: parseInt(priority),
        });
        roleId = response.roleId;
      }

      if (response.success) {
        // If we have permissions to assign, do it
        if (selectedPermissions.size > 0) {
          const permissionResponse = await assignPermissionsToRole({
            roleId: roleId,
            permissionIds: Array.from(selectedPermissions),
          });

          if (!permissionResponse.success) {
            toast.warning(`Role ${isEditMode ? "updated" : "created"} but failed to assign some permissions: ${permissionResponse.error}`);
          }
        }

        revalidatePathSSR("/dashboard/users/roles");
        revalidatePathSSR("/dashboard/users");
        revalidatePathSSR("/dashboard/users/permissions");

        toast.success(isEditMode ? `Role "${roleName}" updated successfully` : `Role "${roleName}" created successfully`);
        setOpen(false);
        if (!isEditMode) {
          setRoleName("");
          setPriority(100);
          setSelectedPermissions(new Set());
        }
      } else {
        toast.error(`Failed to ${isEditMode ? "update" : "create"} role: ${response.error}`);
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
      if (newOpen) {
        setActiveTab("basic");
      }
    }
  };

  // Group permissions by resource for better UI
  const permissionsByResource = availablePermissions.reduce((acc, permission) => {
    // If permission has resources, group by each resource
    if (permission.resources && permission.resources.length > 0) {
      permission.resources.forEach((resource) => {
        const resourceName = resource.resource_name || "Unknown Resource";
        if (!acc[resourceName]) {
          acc[resourceName] = [];
        }
        // Add permission with resource context
        acc[resourceName].push({
          ...permission,
          currentResource: resource,
        });
      });
    } else {
      // If no resources, put in "General" category
      const categoryName = "General Permissions";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(permission);
    }
    return acc;
  }, {});

  return (
    <Dialog className={isEditMode ? "" : "ms-auto"} onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        asChild
        className={isEditMode ? "" : "ms-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer px-3 py-1.5"}
      >
        {isEditMode ? (
          <button className="hover:underline underline-offset-3">Edit</button>
        ) : (
          <button onClick={() => setOpen(true)}>Create Role</button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit" : "Create"} Role</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the role details and permissions below. Lower priority numbers indicate higher access levels."
              : "Create a new role. Lower priority numbers indicate higher access levels (1 = highest, 999 = lowest)."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 mt-3" onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Details</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="role-name" className="block mb-2">
                  Role Name
                </Label>
                <Input
                  id="role-name"
                  name="role-name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Enter a unique role name"
                  disabled={isSubmitting}
                  className="mb-2"
                />
              </div>

              <div>
                <Label htmlFor="role-priority" className="block mb-2">
                  Priority (1-999)
                </Label>
                <Input
                  id="role-priority"
                  name="role-priority"
                  type="number"
                  min="1"
                  max="999"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  placeholder="Enter priority (lower = higher access)"
                  disabled={isSubmitting}
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  Examples: 1-10 (System Admin), 11-30 (Admin), 31-50 (Manager), 51-100 (Staff), 100+ (Customer)
                </p>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div>
                <Label className="text-base font-medium">Assign Permissions</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the permissions this role should have. Permissions are grouped by resource.
                </p>

                <ScrollArea className="h-[400px] w-full border rounded-md p-4">
                  {Object.keys(permissionsByResource).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No permissions available. Create some permissions first.</p>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(permissionsByResource).map(([resourceName, permissions]) => (
                        <div key={resourceName} className="space-y-3">
                          <h4 className="font-semibold text-sm text-primary border-b pb-2 mb-3">
                            {resourceName} ({permissions.length} permission{permissions.length !== 1 ? "s" : ""})
                          </h4>
                          <div className="grid grid-cols-1 gap-3 pl-4">
                            {permissions.map((permission) => (
                              <div
                                key={`${permission.id}-${permission.currentResource?.resource_id || "general"}`}
                                className="flex items-center space-x-3"
                              >
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={selectedPermissions.has(permission.id)}
                                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                                  disabled={isSubmitting}
                                />
                                <Label htmlFor={`permission-${permission.id}`} className="flex-1 cursor-pointer">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">{permission.name}</span>
                                    {permission.currentResource && (
                                      <span className="text-xs text-muted-foreground">
                                        Applied to: {permission.currentResource.resource_name}
                                      </span>
                                    )}
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="text-sm text-muted-foreground">
                  Selected: {selectedPermissions.size} permission{selectedPermissions.size !== 1 ? "s" : ""}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update" : "Create") + " Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

RoleDialog.displayName = "RoleDialog";
export default RoleDialog;
