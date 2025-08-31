"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { roles as cache_key_roles, role as cache_key_role, permissions as cache_key_permissions } from "@/cache_keys";

/**
 * Delete a role and all its associations
 * @param {Object} params - Delete parameters
 * @param {number} params.roleId - Role ID to delete
 * @param {string} [params.deleted_by] - ID of the user deleting the role
 * @returns {Promise<Object>} - Result with success status
 */
async function deleteRole({ roleId, deleted_by }) {
  try {
    // Validate required fields
    if (!roleId) {
      return { error: "Role ID is required" };
    }

    // Check if role exists
    const existingRole = await query("SELECT id, name, priority FROM roles WHERE id = $1", [roleId]);

    if (existingRole.rowCount === 0) {
      return { error: "Role not found" };
    }

    const role = existingRole.rows[0];

    // Check if user has permission to delete this role
    if (deleted_by) {
      const deleterPriority = await query("SELECT get_user_highest_priority($1) as priority", [deleted_by]);

      const deleterHighestPriority = deleterPriority.rows[0].priority;

      // User can only delete roles with lower priority than their own
      if (deleterHighestPriority >= role.priority) {
        return {
          error: `Insufficient privileges: Cannot delete role with equal or higher priority than your own (${deleterHighestPriority})`,
        };
      }
    }

    // Check how many users are assigned to this role
    const userRolesCount = await query(
      `SELECT COUNT(*) as count FROM user_roles 
       WHERE role_id = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
      [roleId]
    );

    const activeUserCount = parseInt(userRolesCount.rows[0].count);

    // Check how many permissions are assigned to this role
    const rolePermissionsCount = await query("SELECT COUNT(*) as count FROM role_permissions WHERE role_id = $1", [roleId]);

    const permissionCount = parseInt(rolePermissionsCount.rows[0].count);

    // Start transaction for safe deletion
    await query("BEGIN");

    try {
      // Delete role_permissions
      await query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);

      // Delete user_roles (remove role assignments from users)
      await query("DELETE FROM user_roles WHERE role_id = $1", [roleId]);

      // Delete the role itself
      await query("DELETE FROM roles WHERE id = $1", [roleId]);

      // Commit transaction
      await query("COMMIT");

      // Revalidate cache
      revalidateTag(cache_key_roles);
      revalidateTag(cache_key_role(roleId));
      revalidateTag(cache_key_permissions); // Permission assignments might be affected

      return {
        success: true,
        message: `Role "${role.name}" deleted successfully.`,
        deletedRole: role,
        impact: {
          users_affected: activeUserCount,
          permissions_removed: permissionCount,
        },
      };
    } catch (error) {
      // Rollback transaction on error
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error deleting role:", error);

    // Handle foreign key constraint violations
    if (error.code === "23503") {
      return { error: "Cannot delete role: it is referenced by other records" };
    }

    return { error: error.message || "Unknown database error" };
  }
}

export default deleteRole;
