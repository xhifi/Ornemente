"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import assignRoleToUser from "@/data/dal/auth/roles/assign-role-to-user";
import removeRoleFromUser from "@/data/dal/auth/roles/remove-role-from-user";
import { toast } from "sonner";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useState, useEffect } from "react";

const UserRoleManager = ({ user, availableRoles, currentRoles }) => {
  const [open, setOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected roles with current user roles
  useEffect(() => {
    if (open && currentRoles) {
      const currentRoleIds = new Set(currentRoles.map((role) => role.role_id));
      setSelectedRoles(currentRoleIds);
    }
  }, [open, currentRoles]);

  const handleRoleToggle = (roleId) => {
    const newSelectedRoles = new Set(selectedRoles);
    if (newSelectedRoles.has(roleId)) {
      newSelectedRoles.delete(roleId);
    } else {
      newSelectedRoles.add(roleId);
    }
    setSelectedRoles(newSelectedRoles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentRoleIds = new Set(currentRoles.map((role) => role.role_id));
      const rolesToAdd = [...selectedRoles].filter((roleId) => !currentRoleIds.has(roleId));
      const rolesToRemove = [...currentRoleIds].filter((roleId) => !selectedRoles.has(roleId));

      // Remove roles that are no longer selected
      for (const roleIdToRemove of rolesToRemove) {
        try {
          const response = await removeRoleFromUser(user.id, roleIdToRemove);

          if (!response.success) {
            toast.error(`Failed to remove role: ${response.error}`);
          }
        } catch (error) {
          console.error(`Error removing role ${roleIdToRemove}:`, error);
          toast.error(`Failed to remove role: ${error.message}`);
        }
      }

      // Add new roles
      for (const roleIdToAdd of rolesToAdd) {
        try {
          const response = await assignRoleToUser({
            userId: user.id,
            roleId: roleIdToAdd,
          });

          if (!response.success) {
            toast.error(`Failed to assign role: ${response.error}`);
          }
        } catch (error) {
          console.error(`Error assigning role ${roleIdToAdd}:`, error);
          toast.error(`Failed to assign role: ${error.message}`);
        }
      }

      // Show success message
      const changesCount = rolesToAdd.length + rolesToRemove.length;
      if (changesCount > 0) {
        toast.success(`Successfully updated roles for ${user.name || user.email}`);

        // Revalidate pages
        revalidatePathSSR("/dashboard/users");
        revalidatePathSSR("/dashboard/users/roles");
      } else {
        toast.info("No changes were made");
      }

      setOpen(false);
    } catch (error) {
      toast.error(`Error updating user roles: ${error.message}`);
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
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Manage Roles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            Update roles for <strong>{user.name || user.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            <Label className="text-base font-medium">Available Roles:</Label>
            {availableRoles.map((role) => {
              const isSelected = selectedRoles.has(role.id);
              return (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={isSelected}
                    onCheckedChange={() => handleRoleToggle(role.id)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor={`role-${role.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                    <span>{role.name}</span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        role.priority <= 10
                          ? "bg-red-100 text-red-800"
                          : role.priority <= 30
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      Priority: {role.priority}
                    </span>
                  </Label>
                </div>
              );
            })}
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Updating..." : "Update Roles"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserRoleManager;
