"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { roles as cache_key_roles } from "@/cache_keys";
import { hasPermission } from "@/lib/authorization";

/**
 * Get all roles (simple list without pagination) - useful for dropdowns and forms
 * @param {Object} options - Options for filtering
 * @param {boolean} [options.includeUserCount=false] - Whether to include user count
 * @param {string} [options.orderBy='priority'] - Order by 'priority', 'name', or 'created_at'
 * @param {string} [options.orderDirection='ASC'] - Order direction 'ASC' or 'DESC'
 * @returns {Promise<Object>} - List of all roles
 */
const getAllRoles = async ({ includeUserCount = false, orderBy = "priority", orderDirection = "ASC" } = {}) => {
  if (!(await hasPermission("read", "roles"))) {
    return { success: false, error: "You are unauthorized to view roles", unauthorized: true };
  }

  return unstable_cache(
    async () => {
      try {
        // Validate orderBy parameter
        const validOrderBy = ["priority", "name", "created_at"];
        if (!validOrderBy.includes(orderBy)) {
          orderBy = "priority";
        }

        // Validate orderDirection parameter
        const validDirection = ["ASC", "DESC"];
        if (!validDirection.includes(orderDirection.toUpperCase())) {
          orderDirection = "ASC";
        }

        // Build query based on options
        let queryText = `
        SELECT 
          r.id,
          r.name,
          r.priority,
          r.created_at,
          r.updated_at
      `;

        if (includeUserCount) {
          queryText += `,
          COALESCE((
            SELECT COUNT(*) 
            FROM user_roles ur 
            WHERE ur.role_id = r.id 
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          ), 0) as user_count
        `;
        }

        queryText += `
        FROM roles r
        ORDER BY r.${orderBy} ${orderDirection}
      `;

        // For priority ordering, add name as secondary sort to ensure consistent ordering
        if (orderBy === "priority") {
          queryText = queryText.replace(`ORDER BY r.${orderBy} ${orderDirection}`, `ORDER BY r.${orderBy} ${orderDirection}, r.name ASC`);
        }

        const result = await query(queryText);

        const roles = result.rows.map((role) => ({
          ...role,
          user_count: includeUserCount ? parseInt(role.user_count || 0, 10) : undefined,
        }));

        return {
          success: true,
          roles,
          total: roles.length,
          meta: {
            orderedBy: orderBy,
            orderDirection,
            includeUserCount,
          },
        };
      } catch (error) {
        return { error: error.message || "Unknown database error" };
      }
    },
    [cache_key_roles],
    {
      tags: [cache_key_roles],
      revalidate: 3600,
    }
  )();
};

export default getAllRoles;
