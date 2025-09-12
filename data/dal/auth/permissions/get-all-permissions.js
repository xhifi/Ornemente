"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { permissions as cache_key_permissions } from "@/cache_keys";
import { hasPermission } from "@/lib/authorization";

/**
 * Get all permissions (simple list without pagination) - useful for dropdowns and forms
 * @param {Object} options - Options for filtering
 * @param {boolean} [options.includeResourceCount=false] - Whether to include resource count
 * @param {string} [options.orderBy='name'] - Order by 'name' or 'created_at'
 * @param {string} [options.orderDirection='ASC'] - Order direction 'ASC' or 'DESC'
 * @returns {Promise<Object>} - List of all permissions
 */
const getAllPermissions = async ({ includeResourceCount = false, orderBy = "resources", orderDirection = "ASC" } = {}) => {
  if (!(await hasPermission("read", "permissions"))) {
    return { success: false, error: "Not allowed to read any permissions", unauthorized: true };
  }

  return unstable_cache(
    async () => {
      try {
        // Validate orderBy parameter
        const validOrderBy = ["name", "created_at", "resources"];
        if (!validOrderBy.includes(orderBy)) {
          orderBy = "name";
        }

        // Validate orderDirection parameter
        const validDirection = ["ASC", "DESC"];
        if (!validDirection.includes(orderDirection.toUpperCase())) {
          orderDirection = "ASC";
        }

        // Build query based on options
        let queryText = `
        SELECT 
          p.id,
          p.name,
          p.created_at,
          p.updated_at,
          COALESCE(
            JSON_AGG(
              CASE 
                WHEN r.id IS NOT NULL THEN 
                  JSON_BUILD_OBJECT(
                    'resource_id', r.id,
                    'resource_name', r.name
                  )
                ELSE NULL
              END
            ) FILTER (WHERE r.id IS NOT NULL), 
            '[]'::json
          ) as resources
      `;

        if (includeResourceCount) {
          queryText += `,
          COUNT(DISTINCT rp.resource_id) as resource_count
        `;
        }

        queryText += `
        FROM permissions p
        LEFT JOIN resource_permissions rp ON p.id = rp.permission_id
        LEFT JOIN resources r ON rp.resource_id = r.id
        GROUP BY p.id, p.name, p.created_at, p.updated_at
      `;

        // Handle ordering
        if (orderBy === "resources") {
          // Order by resource name - handle both new and old formats
          queryText += `
        ORDER BY 
          CASE 
            WHEN p.name LIKE '%.%' THEN SPLIT_PART(p.name, '.', 1)
            ELSE (
              SELECT r_inner.name 
              FROM resource_permissions rp_inner 
              JOIN resources r_inner ON rp_inner.resource_id = r_inner.id 
              WHERE rp_inner.permission_id = p.id 
              ORDER BY r_inner.name 
              LIMIT 1
            )
          END ${orderDirection}, 
          CASE 
            WHEN p.name LIKE '%.%' THEN SPLIT_PART(p.name, '.', 2)
            ELSE p.name
          END ASC
        `;
        } else {
          queryText += `ORDER BY p.${orderBy} ${orderDirection}`;
        }

        const result = await query(queryText);

        const permissions = result.rows.map((permission) => ({
          ...permission,
          resources: Array.isArray(permission.resources) ? permission.resources : [],
          resource_count: includeResourceCount ? parseInt(permission.resource_count || 0, 10) : undefined,
        }));

        return {
          success: true,
          permissions,
          total: permissions.length,
          meta: {
            orderedBy: orderBy,
            orderDirection,
            includeResourceCount,
          },
        };
      } catch (error) {
        console.log("Error getting all permissions:", error);
        return { error: error.message || "Unknown database error" };
      }
    },
    [cache_key_permissions],
    {
      tags: [cache_key_permissions],
      revalidate: 3600,
    }
  )();
};

export default getAllPermissions;
