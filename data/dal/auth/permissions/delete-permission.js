"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import {
  permissions as cache_key_permissions,
  permission as cache_key_permission,
  roles as cache_key_roles,
  resources as cache_key_resources,
} from "@/cache_keys";

/**
 * Delete a permission and all its associations
 * @param {Object} params - Delete parameters
 * @param {number} params.permissionId - Permission ID to delete
 * @param {string} [params.deleted_by] - ID of the user deleting the permission
 * @returns {Promise<Object>} - Result with success status
 */
async function deletePermission({ permissionId, deleted_by }) {
  try {
    // Validate required fields
    if (!permissionId) {
      return { error: "Permission ID is required" };
    }

    // Check if permission exists
    const existingPermission = await query("SELECT id, name FROM permissions WHERE id = $1", [permissionId]);

    if (existingPermission.rowCount === 0) {
      return { error: "Permission not found" };
    }

    const permission = existingPermission.rows[0];

    // Check how many resource-permission combinations use this permission
    const resourcePermissionsCount = await query("SELECT COUNT(*) as count FROM resource_permissions WHERE permission_id = $1", [
      permissionId,
    ]);

    const count = parseInt(resourcePermissionsCount.rows[0].count);

    // Start transaction for safe deletion
    await query("BEGIN");

    try {
      // Delete role_permissions that reference resource_permissions using this permission
      await query(
        `
        DELETE FROM role_permissions 
        WHERE resource_permission_id IN (
          SELECT id FROM resource_permissions WHERE permission_id = $1
        )
      `,
        [permissionId]
      );

      // Delete resource_permissions using this permission
      await query("DELETE FROM resource_permissions WHERE permission_id = $1", [permissionId]);

      // Delete the permission itself
      await query("DELETE FROM permissions WHERE id = $1", [permissionId]);

      // Commit transaction
      await query("COMMIT");

      // Revalidate cache
      revalidateTag(cache_key_permissions);
      revalidateTag(cache_key_permission(permissionId));
      revalidateTag(cache_key_roles); // Role permissions might be affected
      revalidateTag(cache_key_resources); // Resource permissions might be affected

      return {
        success: true,
        message: `Permission "${permission.name}" deleted successfully. ${count} resource-permission combinations were also removed.`,
        deletedPermission: permission,
        affectedResourcePermissions: count,
      };
    } catch (error) {
      // Rollback transaction on error
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error deleting permission:", error);

    // Handle foreign key constraint violations
    if (error.code === "23503") {
      return { error: "Cannot delete permission: it is referenced by other records" };
    }

    return { error: error.message || "Unknown database error" };
  }
}

export default deletePermission;
