"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { role as cache_key_role, roles as cache_key_roles } from "@/cache_keys";

/**
 * Get a role by ID with all its details
 */
function getRoleById(roleId) {
  return unstable_cache(
    async () => {
      try {
        // Get role details
        const roleResult = await query(
          `
          SELECT 
            r.id,
            r.name,
            r.priority,
            r.created_at,
            r.updated_at,
            r.created_by,
            r.updated_by
          FROM roles r
          WHERE r.id = $1
        `,
          [roleId]
        );

        if (roleResult.rowCount === 0) {
          return { error: "Role not found" };
        }

        const role = roleResult.rows[0];

        // Get permission assignments for this role
        const permissionsResult = await query(
          `
          SELECT 
            p.id as permission_id,
            p.name as permission_name,
            r_res.id as resource_id,
            r_res.name as resource_name,
            rp.id as resource_permission_id,
            role_p.id as role_permission_id,
            role_p.created_at as assigned_at
          FROM role_permissions role_p
          JOIN resource_permissions rp ON role_p.resource_permission_id = rp.id
          JOIN permissions p ON rp.permission_id = p.id
          JOIN resources r_res ON rp.resource_id = r_res.id
          WHERE role_p.role_id = $1
          ORDER BY r_res.name, p.name
        `,
          [roleId]
        );

        // Group permissions by permission type
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
          });
        });

        const permissions = Object.values(permissionMap);

        // Get users assigned to this role
        const usersResult = await query(
          `SELECT 
            u.id as user_id,
            u.name as user_name,
            u.email as user_email,
            ur.assigned_at,
            ur.expires_at,
            ur.assigned_by
          FROM user_roles ur
          JOIN users u ON ur.user_id = u.id
          WHERE ur.role_id = $1
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          ORDER BY ur.assigned_at DESC`,
          [roleId]
        );

        // Get summary statistics
        const statsResult = await query(
          `
          SELECT 
            COUNT(DISTINCT p.id) as total_permissions,
            COUNT(DISTINCT r_res.id) as total_resources,
            COUNT(DISTINCT ur.user_id) as total_users,
            COUNT(*) as total_permission_assignments
          FROM role_permissions role_p
          LEFT JOIN resource_permissions rp ON role_p.resource_permission_id = rp.id
          LEFT JOIN permissions p ON rp.permission_id = p.id
          LEFT JOIN resources r_res ON rp.resource_id = r_res.id
          LEFT JOIN user_roles ur ON ur.role_id = $1 AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          WHERE role_p.role_id = $1
        `,
          [roleId]
        );

        const stats = statsResult.rows[0];

        return {
          success: true,
          role: {
            ...role,
            permissions,
            users: usersResult.rows,
            stats: {
              total_permissions: parseInt(stats.total_permissions || 0),
              total_resources: parseInt(stats.total_resources || 0),
              total_users: parseInt(stats.total_users || 0),
              total_permission_assignments: parseInt(stats.total_permission_assignments || 0),
            },
          },
        };
      } catch (error) {
        console.error("Error getting role:", error);
        return { error: error.message || "Unknown database error" };
      }
    },
    [cache_key_role(roleId), cache_key_roles],
    {
      tags: [cache_key_role(roleId), cache_key_roles],
      revalidate: 3600,
    }
  )();
}

export default getRoleById;
