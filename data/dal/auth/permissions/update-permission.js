"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { permissions as cache_key_permissions, permission as cache_key_permission } from "@/cache_keys";

/**
 * Update a permission
 * @param {Object} params - Update parameters
 * @param {number} params.permissionId - Permission ID to update
 * @param {string} params.name - New permission name
 * @param {string} [params.updated_by] - ID of the user updating the permission
 * @returns {Promise<Object>} - Result with success status and updated permission data
 */
async function updatePermission({ permissionId, name, updated_by }) {
  try {
    // Validate required fields
    if (!permissionId) {
      return { error: "Permission ID is required" };
    }

    if (!name || name.trim() === "") {
      return { error: "Permission name is required" };
    }

    // Check if permission exists
    const existingPermission = await query("SELECT id, name FROM permissions WHERE id = $1", [permissionId]);

    if (existingPermission.rowCount === 0) {
      return { error: "Permission not found" };
    }

    // Check if another permission with this name already exists (excluding current)
    const duplicateCheck = await query("SELECT id FROM permissions WHERE name = $1 AND id != $2", [name.trim(), permissionId]);

    if (duplicateCheck.rowCount > 0) {
      return { error: "Permission with this name already exists" };
    }

    // Update the permission
    const result = await query(
      `
      UPDATE permissions 
      SET 
        name = $1,
        updated_by = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `,
      [name.trim(), updated_by, permissionId]
    );

    const permission = result.rows[0];

    // Revalidate cache
    revalidateTag(cache_key_permissions);
    revalidateTag(cache_key_permission(permissionId));

    return {
      success: true,
      permission,
      message: "Permission updated successfully",
    };
  } catch (error) {
    console.error("Error updating permission:", error);

    // Handle unique constraint violation
    if (error.code === "23505") {
      return { error: "Permission with this name already exists" };
    }

    return { error: error.message || "Unknown database error" };
  }
}

export default updatePermission;
