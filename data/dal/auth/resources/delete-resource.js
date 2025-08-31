"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";

/**
 * Delete a resource
 * @param {Object} params - The resource deletion parameters
 * @param {number} params.resourceId - The ID of the resource to delete
 * @param {string} [params.deletedBy] - The ID of the user deleting the resource
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const deleteResource = async ({ resourceId, deletedBy = null }) => {
  try {
    // Validate input
    if (!resourceId || isNaN(resourceId)) {
      return {
        success: false,
        error: "Valid resource ID is required",
      };
    }

    // Check if resource exists
    const resourceCheck = await query("SELECT id, name FROM resources WHERE id = $1", [resourceId]);

    if (resourceCheck.rows.length === 0) {
      return {
        success: false,
        error: "Resource not found",
      };
    }

    const resourceName = resourceCheck.rows[0].name;

    // Check if resource has associated permissions
    const associatedPermissions = await query("SELECT COUNT(*) as count FROM resource_permissions WHERE resource_id = $1", [resourceId]);

    const permissionCount = parseInt(associatedPermissions.rows[0].count);

    if (permissionCount > 0) {
      return {
        success: false,
        error: `Cannot delete resource "${resourceName}" because it has ${permissionCount} associated permission(s). Please remove all associated permissions first.`,
      };
    }

    // Delete the resource
    const result = await query("DELETE FROM resources WHERE id = $1", [resourceId]);

    if (result.rowCount === 0) {
      return {
        success: false,
        error: "Failed to delete resource",
      };
    }

    // Revalidate cache
    revalidateTag("resources");
    revalidateTag("all-resources");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting resource:", error);

    // Handle foreign key constraint errors
    if (error.code === "23503") {
      return {
        success: false,
        error: "Cannot delete resource because it is referenced by other records. Please remove all associated permissions first.",
      };
    }

    return {
      success: false,
      error: error.message || "Unknown database error",
    };
  }
};

export default deleteResource;
