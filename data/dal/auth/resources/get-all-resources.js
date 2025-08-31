"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";

/**
 * Get all resources in the system
 * @param {Object} options - Options for the query
 * @param {boolean} [options.includePermissionCount=false] - Whether to include permission count
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
const getAllResources = unstable_cache(
  async ({ includePermissionCount = false } = {}) => {
    try {
      let queryText = `
        SELECT 
          r.id,
          r.name,
          r.created_at,
          r.updated_at
      `;

      if (includePermissionCount) {
        queryText += `,
          COUNT(DISTINCT rp.permission_id) as permission_count
        `;
      }

      queryText += `
        FROM resources r
      `;

      if (includePermissionCount) {
        queryText += `
          LEFT JOIN resource_permissions rp ON r.id = rp.resource_id
        `;
      }

      queryText += `
        ${includePermissionCount ? "GROUP BY r.id, r.name, r.created_at, r.updated_at" : ""}
        ORDER BY r.name ASC
      `;

      const result = await query(queryText);

      const resources = result.rows.map((resource) => ({
        ...resource,
        permission_count: includePermissionCount ? parseInt(resource.permission_count || 0, 10) : undefined,
      }));

      return {
        success: true,
        data: resources,
      };
    } catch (error) {
      console.error("Error fetching all resources:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
  ["all-resources"],
  {
    tags: ["resources"],
    revalidate: 3600, // Cache for 1 hour
  }
);

export default getAllResources;
