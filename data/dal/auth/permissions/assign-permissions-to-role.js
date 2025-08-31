"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { roles as cache_key_roles, role as cache_key_role, permissions as cache_key_permissions } from "@/cache_keys";

/**
 * Assign permissions to a role
 * @param {Object} params - Assignment parameters
 * @param {number} params.roleId - Role ID to assign permissions to
 * @param {number[]} params.permissionIds - Array of permission IDs to assign
 * @param {number[]} [params.resourceIds] - Array of resource IDs (if not provided, assigns to all resources for each permission)
 * @param {string} [params.assigned_by] - ID of the user making the assignment
 * @returns {Promise<Object>} - Result with success status
 */
async function assignPermissionsToRole({ roleId, permissionIds, resourceIds, assigned_by }) {
  try {
    // Validate required fields
    if (!roleId) {
      return { error: "Role ID is required" };
    }

    if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      return { error: "Permission IDs array is required" };
    }

    // Check if role exists
    const roleCheck = await query("SELECT id, name FROM roles WHERE id = $1", [roleId]);
    if (roleCheck.rowCount === 0) {
      return { error: "Role not found" };
    }

    const role = roleCheck.rows[0];

    // Validate permission IDs
    const permissionCheck = await query("SELECT id, name FROM permissions WHERE id = ANY($1)", [permissionIds]);

    if (permissionCheck.rowCount !== permissionIds.length) {
      return { error: "One or more permission IDs are invalid" };
    }

    // Start transaction
    await query("BEGIN");

    try {
      let assignedCount = 0;
      let skippedCount = 0;
      const assignments = [];

      if (resourceIds && resourceIds.length > 0) {
        // Assign specific resource-permission combinations
        for (const permissionId of permissionIds) {
          for (const resourceId of resourceIds) {
            // Check if resource-permission combination exists
            const resourcePermissionCheck = await query(
              "SELECT id FROM resource_permissions WHERE resource_id = $1 AND permission_id = $2",
              [resourceId, permissionId]
            );

            if (resourcePermissionCheck.rowCount === 0) {
              // Create resource-permission combination if it doesn't exist
              const newResourcePermission = await query(
                `
                INSERT INTO resource_permissions (resource_id, permission_id, created_by, updated_by)
                VALUES ($1, $2, $3, $3)
                RETURNING id
              `,
                [resourceId, permissionId, assigned_by]
              );

              const resourcePermissionId = newResourcePermission.rows[0].id;

              // Assign to role
              await query(
                `
                INSERT INTO role_permissions (role_id, resource_permission_id, created_by, updated_by)
                VALUES ($1, $2, $3, $3)
                ON CONFLICT (role_id, resource_permission_id) DO NOTHING
              `,
                [roleId, resourcePermissionId, assigned_by]
              );

              assignedCount++;
              assignments.push({ resourceId, permissionId, resourcePermissionId });
            } else {
              const resourcePermissionId = resourcePermissionCheck.rows[0].id;

              // Check if already assigned to role
              const existingAssignment = await query("SELECT id FROM role_permissions WHERE role_id = $1 AND resource_permission_id = $2", [
                roleId,
                resourcePermissionId,
              ]);

              if (existingAssignment.rowCount === 0) {
                // Assign to role
                await query(
                  `
                  INSERT INTO role_permissions (role_id, resource_permission_id, created_by, updated_by)
                  VALUES ($1, $2, $3, $3)
                `,
                  [roleId, resourcePermissionId, assigned_by]
                );

                assignedCount++;
                assignments.push({ resourceId, permissionId, resourcePermissionId });
              } else {
                skippedCount++;
              }
            }
          }
        }
      } else {
        // Assign all existing resource-permission combinations for the given permissions
        for (const permissionId of permissionIds) {
          const resourcePermissions = await query("SELECT id, resource_id FROM resource_permissions WHERE permission_id = $1", [
            permissionId,
          ]);

          for (const rp of resourcePermissions.rows) {
            // Check if already assigned to role
            const existingAssignment = await query("SELECT id FROM role_permissions WHERE role_id = $1 AND resource_permission_id = $2", [
              roleId,
              rp.id,
            ]);

            if (existingAssignment.rowCount === 0) {
              // Assign to role
              await query(
                `
                INSERT INTO role_permissions (role_id, resource_permission_id, created_by, updated_by)
                VALUES ($1, $2, $3, $3)
              `,
                [roleId, rp.id, assigned_by]
              );

              assignedCount++;
              assignments.push({
                resourceId: rp.resource_id,
                permissionId,
                resourcePermissionId: rp.id,
              });
            } else {
              skippedCount++;
            }
          }
        }
      }

      // Commit transaction
      await query("COMMIT");

      // Revalidate cache
      revalidateTag(cache_key_roles);
      revalidateTag(cache_key_role(roleId));
      revalidateTag(cache_key_permissions);

      return {
        success: true,
        message: `Permissions assigned to role "${role.name}" successfully. ${assignedCount} new assignments, ${skippedCount} already existed.`,
        assignedCount,
        skippedCount,
        assignments,
        role,
      };
    } catch (error) {
      // Rollback transaction on error
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error assigning permissions to role:", error);
    return { error: error.message || "Unknown database error" };
  }
}

export default assignPermissionsToRole;
