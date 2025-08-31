"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";

/**
 * Create a new resource
 * @param {Object} params - The resource creation parameters
 * @param {string} params.name - The name of the resource
 * @param {string} [params.createdBy] - The ID of the user creating the resource
 * @returns {Promise<{success: boolean, resource?: Object, error?: string}>}
 */
const createResource = async ({ name, createdBy = null }) => {
  try {
    // Validate input
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return {
        success: false,
        error: "Resource name is required and must be a non-empty string",
      };
    }

    const trimmedName = name.trim();

    // Check if resource already exists
    const existingResource = await query("SELECT id FROM resources WHERE LOWER(name) = LOWER($1)", [trimmedName]);

    if (existingResource.rows.length > 0) {
      return {
        success: false,
        error: "A resource with this name already exists",
      };
    }

    // Create the resource
    const result = await query(
      `INSERT INTO resources (name, created_by, updated_by) 
       VALUES ($1, $2, $2) 
       RETURNING id, name, created_at, updated_at`,
      [trimmedName, createdBy]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Failed to create resource",
      };
    }

    const newResource = result.rows[0];

    // Revalidate cache
    revalidateTag("resources");
    revalidateTag("all-resources");

    return {
      success: true,
      resource: newResource,
    };
  } catch (error) {
    console.error("Error creating resource:", error);
    return {
      success: false,
      error: error.message || "Unknown database error",
    };
  }
};

export default createResource;
