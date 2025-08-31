"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { roles as cache_key_roles, role as cache_key_role, users as cache_key_users } from "@/cache_keys";

/**
 * Assign a role to a user
 * @param {Object} params - Assignment parameters
 * @param {string} params.userId - User ID to assign role to
 * @param {number} params.roleId - Role ID to assign
 * @param {string} [params.assigned_by] - ID of the user making the assignment
 * @param {Date} [params.expires_at] - Optional expiration date for the role assignment
 * @returns {Promise<Object>} - Result with success status
 */
async function assignRoleToUser({ userId, roleId, assigned_by, expires_at }) {
  try {
    // Validate required fields
    if (!userId) {
      return { error: "User ID is required" };
    }

    if (!roleId) {
      return { error: "Role ID is required" };
    }

    // Check if user exists
    const userCheck = await query("SELECT id, name, email FROM users WHERE id = $1", [userId]);
    if (userCheck.rowCount === 0) {
      return { error: "User not found" };
    }

    const user = userCheck.rows[0];

    // Check if role exists
    const roleCheck = await query("SELECT id, name, priority FROM roles WHERE id = $1", [roleId]);
    if (roleCheck.rowCount === 0) {
      return { error: "Role not found" };
    }

    const role = roleCheck.rows[0];

    // Check if user already has this role
    const existingAssignment = await query(
      `SELECT id FROM user_roles 
       WHERE user_id = $1 AND role_id = $2 
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId, roleId]
    );

    if (existingAssignment.rowCount > 0) {
      return { error: "User already has this role assigned" };
    }

    // Check if assigner has permission (handled by trigger, but we can provide better error message)
    if (assigned_by) {
      const canAssign = await query("SELECT user_can_assign_role($1, $2) as can_assign", [assigned_by, role.name]);

      if (!canAssign.rows[0].can_assign) {
        return {
          error: `Insufficient privileges: Cannot assign role "${role.name}" with priority ${role.priority}`,
        };
      }
    }

    // Insert the role assignment
    const result = await query(
      `
      INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $3, $3)
      RETURNING *
    `,
      [userId, roleId, assigned_by, expires_at]
    );

    const assignment = result.rows[0];

    // Revalidate cache
    revalidateTag(cache_key_roles);
    revalidateTag(cache_key_role(roleId));
    revalidateTag(cache_key_users);

    return {
      success: true,
      assignment,
      message: `Role "${role.name}" assigned to user "${user.name}" successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      role: {
        id: role.id,
        name: role.name,
        priority: role.priority,
      },
    };
  } catch (error) {
    console.error("Error assigning role to user:", error);

    // Handle unique constraint violation
    if (error.code === "23505") {
      return { error: "User already has this role assigned" };
    }

    // Handle trigger constraint (role hierarchy)
    if (error.message && error.message.includes("Insufficient privileges")) {
      return { error: error.message };
    }

    return { error: error.message || "Unknown database error" };
  }
}

export default assignRoleToUser;
