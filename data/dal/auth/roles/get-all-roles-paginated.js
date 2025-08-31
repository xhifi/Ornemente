"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { roles as cache_key_roles } from "@/cache_keys";

/**
 * Get all roles with pagination and search
 * @param {Object} options - Options for pagination, filtering and searching
 * @param {number} [options.page=1] - The page number to fetch
 * @param {number} [options.limit=20] - Number of roles per page
 * @param {string} [options.search=""] - Search term for role name
 * @param {Object} [options.filters={}] - Filter options
 * @param {number} [options.filters.priority_min] - Minimum priority (higher privilege)
 * @param {number} [options.filters.priority_max] - Maximum priority (lower privilege)
 * @param {boolean} [options.filters.has_users] - Filter roles that have users assigned
 * @returns {Promise<Object>} - Roles with pagination details
 */
const getRolesPaginated = unstable_cache(
  async ({ page = 1, limit = 20, search = "", filters = {} } = {}) => {
    try {
      const offset = (page - 1) * limit;
      const params = [];
      let paramIndex = 1;

      // Base query - get roles with counts
      let queryText = `
        SELECT 
          r.*,
          COALESCE((
            SELECT COUNT(DISTINCT p.id) 
            FROM role_permissions rp
            JOIN resource_permissions res_p ON rp.resource_permission_id = res_p.id
            JOIN permissions p ON res_p.permission_id = p.id
            WHERE rp.role_id = r.id
          ), 0) as permission_count,
          COALESCE((
            SELECT COUNT(DISTINCT res.id) 
            FROM role_permissions rp
            JOIN resource_permissions res_p ON rp.resource_permission_id = res_p.id
            JOIN resources res ON res_p.resource_id = res.id
            WHERE rp.role_id = r.id
          ), 0) as resource_count,
          COALESCE((
            SELECT COUNT(*) 
            FROM user_roles ur 
            WHERE ur.role_id = r.id 
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          ), 0) as user_count
        FROM roles r
        WHERE 1=1
      `;

      // Search condition
      if (search) {
        queryText += ` AND r.name ILIKE $${paramIndex}`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Priority range filters
      if (filters.priority_min !== undefined) {
        queryText += ` AND r.priority >= $${paramIndex}`;
        params.push(filters.priority_min);
        paramIndex++;
      }

      if (filters.priority_max !== undefined) {
        queryText += ` AND r.priority <= $${paramIndex}`;
        params.push(filters.priority_max);
        paramIndex++;
      }

      // Filter roles that have users
      if (filters.has_users !== undefined) {
        if (filters.has_users) {
          queryText += ` AND EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.role_id = r.id 
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          )`;
        } else {
          queryText += ` AND NOT EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.role_id = r.id 
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          )`;
        }
      }

      // Add order and pagination - order by priority (highest privilege first)
      queryText += ` 
        ORDER BY r.priority ASC, r.name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      // Execute query
      const result = await query(queryText, params);

      // Get role IDs for detailed queries
      const roleIds = result.rows.map((role) => role.id);

      // Enhance roles with detailed information
      let rolesWithDetails = [...result.rows];

      if (roleIds.length > 0) {
        // Fetch sample permissions for each role (top 3 permissions)
        const permissionsQuery = `
          SELECT 
            rp.role_id,
            p.id as permission_id,
            p.name as permission_name,
            COUNT(DISTINCT res.id) as resource_count,
            ROW_NUMBER() OVER (PARTITION BY rp.role_id ORDER BY p.name) as rn
          FROM role_permissions rp
          JOIN resource_permissions res_p ON rp.resource_permission_id = res_p.id
          JOIN permissions p ON res_p.permission_id = p.id
          JOIN resources res ON res_p.resource_id = res.id
          WHERE rp.role_id = ANY($1)
          GROUP BY rp.role_id, p.id, p.name
          ORDER BY rp.role_id, p.name
        `;
        const permissionsResult = await query(permissionsQuery, [roleIds]);

        // Group permissions by role_id
        const permissionsByRole = {};
        permissionsResult.rows.forEach((permission) => {
          if (!permissionsByRole[permission.role_id]) {
            permissionsByRole[permission.role_id] = [];
          }
          permissionsByRole[permission.role_id].push({
            permission_id: permission.permission_id,
            permission_name: permission.permission_name,
            resource_count: parseInt(permission.resource_count),
          });
        });

        // Fetch sample users for each role (latest 3 users)
        const usersQuery = `
          SELECT 
            ur.role_id,
            u.id as user_id,
            u.name as user_name,
            u.email as user_email,
            ur.assigned_at,
            ROW_NUMBER() OVER (PARTITION BY ur.role_id ORDER BY ur.assigned_at DESC) as rn
          FROM user_roles ur
          JOIN users u ON ur.user_id = u.id
          WHERE ur.role_id = ANY($1)
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          ORDER BY ur.role_id, ur.assigned_at DESC
        `;
        const usersResult = await query(usersQuery, [roleIds]);

        // Group users by role_id
        const usersByRole = {};
        usersResult.rows.forEach((user) => {
          if (!usersByRole[user.role_id]) {
            usersByRole[user.role_id] = [];
          }
          if (user.rn <= 3) {
            // Only take first 3 users
            usersByRole[user.role_id].push({
              user_id: user.user_id,
              user_name: user.user_name,
              user_email: user.user_email,
              assigned_at: user.assigned_at,
            });
          }
        });

        // Add details to roles
        rolesWithDetails = rolesWithDetails.map((role) => ({
          ...role,
          permission_count: parseInt(role.permission_count || 0, 10),
          resource_count: parseInt(role.resource_count || 0, 10),
          user_count: parseInt(role.user_count || 0, 10),
          sample_permissions: permissionsByRole[role.id] || [],
          sample_users: usersByRole[role.id] || [],
        }));
      }

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM roles r
        WHERE 1=1
      `;

      const countParams = [];
      let countParamIndex = 1;

      if (search) {
        countQuery += ` AND r.name ILIKE $${countParamIndex}`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }

      if (filters.priority_min !== undefined) {
        countQuery += ` AND r.priority >= $${countParamIndex}`;
        countParams.push(filters.priority_min);
        countParamIndex++;
      }

      if (filters.priority_max !== undefined) {
        countQuery += ` AND r.priority <= $${countParamIndex}`;
        countParams.push(filters.priority_max);
        countParamIndex++;
      }

      if (filters.has_users !== undefined) {
        if (filters.has_users) {
          countQuery += ` AND EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.role_id = r.id 
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          )`;
        } else {
          countQuery += ` AND NOT EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.role_id = r.id 
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          )`;
        }
      }

      const countResult = await query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        roles: rolesWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        meta: {
          sortedByPriority: true, // Indicate that results are sorted by priority
        },
      };
    } catch (error) {
      console.error("Error getting roles:", error);
      return { error: error.message || "Unknown database error" };
    }
  },
  [cache_key_roles],
  {
    tags: [cache_key_roles],
    revalidate: 3600,
  }
);

export default getRolesPaginated;
