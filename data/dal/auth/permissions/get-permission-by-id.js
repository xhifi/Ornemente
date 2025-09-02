"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { permission as cache_key_permission, permissions as cache_key_permissions } from "@/cache_keys";
import { hasPermission } from "@/lib/authorization";

/**
 * Get a permission by ID with its resource assignments
 */
async function getPermissionById(permissionId) {
  if (!(await hasPermission("read", "permissions"))) {
    return { success: false, error: "Not allowed to read any permissions", unauthorized: true };
  }

  return unstable_cache(
    async () => {
      try {
        // Get permission details
        const permissionResult = await query(
          `
          SELECT 
            p.id,
            p.name,
            p.created_at,
            p.updated_at,
            p.created_by,
            p.updated_by
          FROM permissions p
          WHERE p.id = $1
        `,
          [permissionId]
        );

        if (permissionResult.rowCount === 0) {
          return { error: "Permission not found" };
        }

        const permission = permissionResult.rows[0];

        // Get resource assignments for this permission
        const resourcesResult = await query(
          `
          SELECT 
            rp.id as resource_permission_id,
            r.id as resource_id,
            r.name as resource_name,
            rp.created_at as assigned_at
          FROM resource_permissions rp
          JOIN resources r ON rp.resource_id = r.id
          WHERE rp.permission_id = $1
          ORDER BY r.name
        `,
          [permissionId]
        );

        // Get roles that have this permission
        const rolesResult = await query(
          `
          SELECT DISTINCT
            ro.id as role_id,
            ro.name as role_name,
            ro.priority as role_priority
          FROM role_permissions rp_outer
          JOIN resource_permissions rp ON rp_outer.resource_permission_id = rp.id
          JOIN roles ro ON rp_outer.role_id = ro.id
          WHERE rp.permission_id = $1
          ORDER BY ro.priority ASC, ro.name
        `,
          [permissionId]
        );

        return {
          success: true,
          permission: {
            ...permission,
            resources: resourcesResult.rows,
            roles: rolesResult.rows,
          },
        };
      } catch (error) {
        console.error("Error getting permission:", error);
        return { error: error.message || "Unknown database error" };
      }
    },
    [cache_key_permission(permissionId), cache_key_permissions],
    {
      tags: [cache_key_permission(permissionId), cache_key_permissions],
      revalidate: 3600,
    }
  )();
}

export default getPermissionById;
