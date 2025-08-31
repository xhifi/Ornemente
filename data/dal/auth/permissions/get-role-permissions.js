"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { permissions as cache_key_permissions, role as cache_key_role } from "@/cache_keys";

/**
 * Get all permissions assigned to a specific role
 * @param {Object} params - Parameters
 * @param {number} params.roleId - Role ID to get permissions for
 * @param {boolean} [params.includeResourceDetails=true] - Whether to include resource details
 * @returns {Promise<Object>} - Role permissions with details
 */
function getRolePermissions({ roleId, includeResourceDetails = true }) {
  return unstable_cache(
    async () => {
      try {
        // Validate required fields
        if (!roleId) {
          return { error: "Role ID is required" };
        }

        // Check if role exists
        const roleCheck = await query("SELECT id, name, priority FROM roles WHERE id = $1", [roleId]);

        if (roleCheck.rowCount === 0) {
          return { error: "Role not found" };
        }

        const role = roleCheck.rows[0];

        // Get all permissions assigned to this role
        const permissionsQuery = includeResourceDetails
          ? `
            SELECT 
              p.id as permission_id,
              p.name as permission_name,
              r.id as resource_id,
              r.name as resource_name,
              rp.id as resource_permission_id,
              role_p.id as role_permission_id,
              role_p.created_at as assigned_at,
              role_p.created_by as assigned_by
            FROM role_permissions role_p
            JOIN resource_permissions rp ON role_p.resource_permission_id = rp.id
            JOIN permissions p ON rp.permission_id = p.id
            JOIN resources r ON rp.resource_id = r.id
            WHERE role_p.role_id = $1
            ORDER BY r.name, p.name
          `
          : `
            SELECT DISTINCT
              p.id as permission_id,
              p.name as permission_name,
              COUNT(DISTINCT r.id) as resource_count
            FROM role_permissions role_p
            JOIN resource_permissions rp ON role_p.resource_permission_id = rp.id
            JOIN permissions p ON rp.permission_id = p.id
            JOIN resources r ON rp.resource_id = r.id
            WHERE role_p.role_id = $1
            GROUP BY p.id, p.name
            ORDER BY p.name
          `;

        const permissionsResult = await query(permissionsQuery, [roleId]);

        let permissions;

        if (includeResourceDetails) {
          // Group permissions by permission_id and include resource details
          const permissionMap = {};

          permissionsResult.rows.forEach((row) => {
            if (!permissionMap[row.permission_id]) {
              permissionMap[row.permission_id] = {
                permission_id: row.permission_id,
                permission_name: row.permission_name,
                resources: [],
              };
            }

            permissionMap[row.permission_id].resources.push({
              resource_id: row.resource_id,
              resource_name: row.resource_name,
              resource_permission_id: row.resource_permission_id,
              role_permission_id: row.role_permission_id,
              assigned_at: row.assigned_at,
              assigned_by: row.assigned_by,
            });
          });

          permissions = Object.values(permissionMap);
        } else {
          // Simple list with resource counts
          permissions = permissionsResult.rows;
        }

        // Get total counts
        const countsResult = await query(
          `
          SELECT 
            COUNT(DISTINCT p.id) as total_permissions,
            COUNT(DISTINCT r.id) as total_resources,
            COUNT(*) as total_assignments
          FROM role_permissions role_p
          JOIN resource_permissions rp ON role_p.resource_permission_id = rp.id
          JOIN permissions p ON rp.permission_id = p.id
          JOIN resources r ON rp.resource_id = r.id
          WHERE role_p.role_id = $1
        `,
          [roleId]
        );

        const counts = countsResult.rows[0];

        return {
          success: true,
          role,
          permissions,
          summary: {
            total_permissions: parseInt(counts.total_permissions || 0),
            total_resources: parseInt(counts.total_resources || 0),
            total_assignments: parseInt(counts.total_assignments || 0),
          },
        };
      } catch (error) {
        console.error("Error getting role permissions:", error);
        return { error: error.message || "Unknown database error" };
      }
    },
    [cache_key_role(roleId), cache_key_permissions],
    {
      tags: [cache_key_role(roleId), cache_key_permissions],
      revalidate: 3600,
    }
  )();
}

export default getRolePermissions;
