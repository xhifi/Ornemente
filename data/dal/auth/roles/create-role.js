"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { roles as cache_key_roles, role as cache_key_role } from "@/cache_keys";

/**
 * Create a new role
 * @param {Object} roleData - Role data
 * @param {string} roleData.name - Role name (e.g., 'editor', 'moderator')
 * @param {number} [roleData.priority=100] - Role priority (lower number = higher priority)
 * @param {string} [roleData.created_by] - ID of the user creating the role
 * @returns {Promise<Object>} - Result with success status and role data
 */
async function createRole({ name, priority = 100, created_by }) {
  try {
    // Validate required fields
    if (!name || name.trim() === "") {
      return { error: "Role name is required" };
    }

    // Validate priority
    if (priority !== undefined && (typeof priority !== "number" || priority < 1)) {
      return { error: "Priority must be a positive number" };
    }

    // Check if role with this name already exists
    const existingRole = await query("SELECT id FROM roles WHERE name = $1", [name.trim()]);

    if (existingRole.rowCount > 0) {
      return { error: "Role with this name already exists" };
    }

    // Check if user creating the role has sufficient privileges (if created_by is provided)
    if (created_by) {
      const creatorPriority = await query("SELECT get_user_highest_priority($1) as priority", [created_by]);

      const creatorHighestPriority = creatorPriority.rows[0].priority;

      // User can only create roles with lower priority than their own
      if (creatorHighestPriority >= priority) {
        return {
          error: `Insufficient privileges: Cannot create role with equal or higher priority than your own (${creatorHighestPriority})`,
        };
      }
    }

    // Insert the new role
    const result = await query(
      `
      INSERT INTO roles (name, priority, created_by, updated_by)
      VALUES ($1, $2, $3, $3)
      RETURNING *
    `,
      [name.trim(), priority, created_by]
    );

    const role = result.rows[0];

    // Revalidate cache
    revalidateTag(cache_key_roles);
    revalidateTag(cache_key_role(role.id));

    return {
      success: true,
      role,
      message: "Role created successfully",
    };
  } catch (error) {
    console.error("Error creating role:", error);

    // Handle unique constraint violation
    if (error.code === "23505") {
      return { error: "Role with this name already exists" };
    }

    return { error: error.message || "Unknown database error" };
  }
}

export default createRole;
