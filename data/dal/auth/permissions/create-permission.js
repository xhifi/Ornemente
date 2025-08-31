"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { permissions as cache_key_permissions, permission as cache_key_permission } from "@/cache_keys";

/**
 * Create a new permission
 * @param {Object} permissionData - Permission data
 * @param {string} permissionData.name - Permission name (e.g., 'read', 'create', 'update', 'delete')
 * @param {string} [permissionData.created_by] - ID of the user creating the permission
 * @returns {Promise<Object>} - Result with success status and permission data
 */
async function createPermission({ name, created_by }) {
  try {
    // Validate required fields
    if (!name || name.trim() === "") {
      return { error: "Permission name is required" };
    }

    // Insert the new permission
    const result = await query(
      `
      INSERT INTO permissions (name, created_by, updated_by)
      VALUES ($1, $2, $2)
      RETURNING *
    `,
      [name.trim(), created_by]
    );

    const permission = result.rows[0];

    // Revalidate cache
    revalidateTag(cache_key_permissions);
    revalidateTag(cache_key_permission(permission.id));

    return {
      success: true,
      permission,
      message: "Permission created successfully",
    };
  } catch (error) {
    console.error("Error creating permission:", error);

    // Handle unique constraint violation
    if (error.code === "23505") {
      return { error: "Permission with this name already exists" };
    }

    return { error: error.message || "Unknown database error" };
  }
}

export default createPermission;
