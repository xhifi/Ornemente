"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";

/**
 * Update an existing resource
 * @param {Object} params - The resource update parameters
 * @param {number} params.resourceId - The ID of the resource to update
 * @param {string} params.name - The new name of the resource
 * @param {string} [params.updatedBy] - The ID of the user updating the resource
 * @returns {Promise<{success: boolean, resource?: Object, error?: string}>}
 */
const updateResource = async ({ resourceId, name, updatedBy = null }) => {
  try {
    // Validate input
    if (!resourceId || isNaN(resourceId)) {
      return {
        success: false,
        error: "Valid resource ID is required",
      };
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return {
        success: false,
        error: "Resource name is required and must be a non-empty string",
      };
    }

    const trimmedName = name.trim();

    // Check if resource exists
    const resourceCheck = await query("SELECT id FROM resources WHERE id = $1", [resourceId]);

    if (resourceCheck.rows.length === 0) {
      return {
        success: false,
        error: "Resource not found",
      };
    }

    // Check if another resource with the same name exists (excluding current resource)
    const existingResource = await query("SELECT id FROM resources WHERE LOWER(name) = LOWER($1) AND id != $2", [trimmedName, resourceId]);

    if (existingResource.rows.length > 0) {
      return {
        success: false,
        error: "A resource with this name already exists",
      };
    }

    // Update the resource
    const result = await query(
      `UPDATE resources 
       SET name = $1, updated_by = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, name, created_at, updated_at`,
      [trimmedName, updatedBy, resourceId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Failed to update resource",
      };
    }

    const updatedResource = result.rows[0];

    // Revalidate cache
    revalidateTag("resources");
    revalidateTag("all-resources");

    return {
      success: true,
      resource: updatedResource,
    };
  } catch (error) {
    console.error("Error updating resource:", error);
    return {
      success: false,
      error: error.message || "Unknown database error",
    };
  }
};

export default updateResource;
