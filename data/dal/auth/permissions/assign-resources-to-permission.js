"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { permissions as cache_key_permissions, resources as cache_key_resources } from "@/cache_keys";

/**
 * Assign resources to a permission by creating resource_permissions entries
 * @param {Object} params - Assignment parameters
 * @param {number} params.permissionId - Permission ID
 * @param {number[]} params.resourceIds - Array of resource IDs to assign
 * @param {string} [params.assigned_by] - ID of the user making the assignment
 * @returns {Promise<Object>} - Result with success status
 */
async function assignResourcesToPermission({ permissionId, resourceIds, assigned_by }) {
  try {
    // Convert permissionId to number if it's a string
    const numericPermissionId = typeof permissionId === "string" ? parseInt(permissionId, 10) : permissionId;

    console.log("assignResourcesToPermission called with:", { permissionId, numericPermissionId, resourceIds, assigned_by });

    if (!numericPermissionId || isNaN(numericPermissionId)) {
      return { error: "Valid Permission ID is required" };
    }

    if (!Array.isArray(resourceIds)) {
      return { error: "Resource IDs must be an array" };
    }

    if (resourceIds.length === 0) {
      return { success: true, message: "No resources to assign" };
    }

    // Convert resource IDs to numbers
    const numericResourceIds = resourceIds.map((id) => (typeof id === "string" ? parseInt(id, 10) : id));

    // Validate all resource IDs are valid numbers
    if (numericResourceIds.some((id) => isNaN(id))) {
      return { error: "All resource IDs must be valid numbers" };
    }

    // Start transaction
    await query("BEGIN");

    try {
      // First, remove existing resource-permission associations
      await query("DELETE FROM resource_permissions WHERE permission_id = $1", [numericPermissionId]);

      // Insert new resource-permission associations
      const insertPromises = numericResourceIds.map((resourceId) =>
        query(
          `INSERT INTO resource_permissions (resource_id, permission_id, created_by, updated_by)
           VALUES ($1, $2, $3, $3)
           ON CONFLICT (resource_id, permission_id) DO NOTHING`,
          [resourceId, numericPermissionId, assigned_by]
        )
      );

      await Promise.all(insertPromises);

      // Commit transaction
      await query("COMMIT");

      // Revalidate cache
      revalidateTag(cache_key_permissions);
      revalidateTag(cache_key_resources);

      return {
        success: true,
        message: `Successfully assigned ${numericResourceIds.length} resources to permission`,
        assignedCount: numericResourceIds.length,
      };
    } catch (error) {
      // Rollback transaction on error
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error assigning resources to permission:", error);
    return { error: error.message || "Unknown database error" };
  }
}

export default assignResourcesToPermission;
