"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { permissions as cache_key_permissions } from "@/cache_keys";

/**
 * Get all permissions with pagination and search
 * @param {Object} options - Options for pagination, filtering and searching
 * @param {number} [options.page=1] - The page number to fetch
 * @param {number} [options.limit=20] - Number of permissions per page
 * @param {string} [options.search=""] - Search term for permission name
 * @param {Object} [options.filters={}] - Filter options
 * @param {number|number[]} [options.filters.resource_id] - Filter by resource ID
 * @returns {Promise<Object>} - Permissions with pagination details
 */
const getPermissionsPaginated = unstable_cache(
  async ({ page = 1, limit = 20, search = "", filters = {} } = {}) => {
    try {
      const offset = (page - 1) * limit;
      const params = [];
      let paramIndex = 1;

      // Base query - get permissions with resource count
      let queryText = `
        SELECT 
          p.*,
          COALESCE((
            SELECT COUNT(*) 
            FROM resource_permissions rp 
            WHERE rp.permission_id = p.id
          ), 0) as resource_count,
          COALESCE((
            SELECT COUNT(DISTINCT ro.id)
            FROM role_permissions rp_outer
            JOIN resource_permissions rp ON rp_outer.resource_permission_id = rp.id
            JOIN roles ro ON rp_outer.role_id = ro.id
            WHERE rp.permission_id = p.id
          ), 0) as role_count
        FROM permissions p
        WHERE 1=1
      `;

      // Search condition
      if (search) {
        queryText += ` AND p.name ILIKE $${paramIndex}`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Filter by resource
      if (filters.resource_id) {
        queryText += ` AND EXISTS (
          SELECT 1 FROM resource_permissions rp 
          WHERE rp.permission_id = p.id AND rp.resource_id = $${paramIndex}
        )`;
        params.push(filters.resource_id);
        paramIndex++;
      }

      // Add order and pagination
      queryText += ` 
        ORDER BY p.name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      // Execute query
      const result = await query(queryText, params);

      // Get permission IDs for detailed queries
      const permissionIds = result.rows.map((permission) => permission.id);

      // Enhance permissions with resource and role details
      let permissionsWithDetails = [...result.rows];

      if (permissionIds.length > 0) {
        // Fetch resources for all permissions
        const resourcesQuery = `
          SELECT 
            rp.permission_id,
            r.id as resource_id,
            r.name as resource_name,
            rp.id as resource_permission_id
          FROM resource_permissions rp
          JOIN resources r ON rp.resource_id = r.id
          WHERE rp.permission_id = ANY($1)
          ORDER BY rp.permission_id, r.name
        `;
        const resourcesResult = await query(resourcesQuery, [permissionIds]);

        // Group resources by permission_id
        const resourcesByPermission = {};
        resourcesResult.rows.forEach((resource) => {
          if (!resourcesByPermission[resource.permission_id]) {
            resourcesByPermission[resource.permission_id] = [];
          }
          resourcesByPermission[resource.permission_id].push({
            resource_id: resource.resource_id,
            resource_name: resource.resource_name,
            resource_permission_id: resource.resource_permission_id,
          });
        });

        // Fetch roles for all permissions
        const rolesQuery = `
          SELECT DISTINCT
            rp.permission_id,
            ro.id as role_id,
            ro.name as role_name,
            ro.priority as role_priority
          FROM role_permissions rp_outer
          JOIN resource_permissions rp ON rp_outer.resource_permission_id = rp.id
          JOIN roles ro ON rp_outer.role_id = ro.id
          WHERE rp.permission_id = ANY($1)
          ORDER BY rp.permission_id, ro.priority ASC, ro.name
        `;
        const rolesResult = await query(rolesQuery, [permissionIds]);

        // Group roles by permission_id
        const rolesByPermission = {};
        rolesResult.rows.forEach((role) => {
          if (!rolesByPermission[role.permission_id]) {
            rolesByPermission[role.permission_id] = [];
          }
          rolesByPermission[role.permission_id].push({
            role_id: role.role_id,
            role_name: role.role_name,
            role_priority: role.role_priority,
          });
        });

        // Add resources and roles to permissions
        permissionsWithDetails = permissionsWithDetails.map((permission) => ({
          ...permission,
          resources: resourcesByPermission[permission.id] || [],
          roles: rolesByPermission[permission.id] || [],
          resource_count: parseInt(permission.resource_count || 0, 10),
          role_count: parseInt(permission.role_count || 0, 10),
        }));
      }

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM permissions p
        WHERE 1=1
      `;

      const countParams = [];
      let countParamIndex = 1;

      if (search) {
        countQuery += ` AND p.name ILIKE $${countParamIndex}`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }

      if (filters.resource_id) {
        countQuery += ` AND EXISTS (
          SELECT 1 FROM resource_permissions rp 
          WHERE rp.permission_id = p.id AND rp.resource_id = $${countParamIndex}
        )`;
        countParams.push(filters.resource_id);
        countParamIndex++;
      }

      const countResult = await query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        permissions: permissionsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error getting permissions:", error);
      return { error: error.message || "Unknown database error" };
    }
  },
  [cache_key_permissions],
  {
    tags: [cache_key_permissions],
    revalidate: 3600,
  }
);

export default getPermissionsPaginated;
