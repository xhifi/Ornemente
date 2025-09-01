"use server";

import { query } from "@/lib/db";

/**
 * Clear all permissions for a specific role
 * @param {number} roleId - The ID of the role to clear permissions for
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export default async function clearRolePermissions(roleId) {
  try {
    // Validate input
    if (!roleId || typeof roleId !== "number") {
      return { success: false, error: "Valid role ID is required" };
    }

    // Clear all permissions for the role
    await query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);

    return { success: true };
  } catch (error) {
    console.error("Error clearing role permissions:", error);
    return { success: false, error: error.message };
  }
}
