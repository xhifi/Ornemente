"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { roles as cache_key_roles, role as cache_key_role } from "@/cache_keys";

/**
 * Update a role
 * @param {Object} params - Update parameters
 * @param {number} params.roleId - Role ID to update
 * @param {string} [params.name] - New role name
 * @param {number} [params.priority] - New role priority
 * @param {string} [params.updated_by] - ID of the user updating the role
 * @returns {Promise<Object>} - Result with success status and updated role data
 */
async function updateRole({ roleId, name, priority, updated_by }) {
  try {
    // Validate required fields
    if (!roleId) {
      return { error: "Role ID is required" };
    }

    // At least one field must be provided for update
    if (!name && priority === undefined) {
      return { error: "At least one field (name or priority) must be provided for update" };
    }

    // Check if role exists
    const existingRole = await query("SELECT id, name, priority FROM roles WHERE id = $1", [roleId]);

    if (existingRole.rowCount === 0) {
      return { error: "Role not found" };
    }

    const currentRole = existingRole.rows[0];

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];
    let paramIndex = 1;

    if (name && name.trim() !== "") {
      // Check if another role with this name already exists (excluding current)
      const duplicateCheck = await query("SELECT id FROM roles WHERE name = $1 AND id != $2", [name.trim(), roleId]);

      if (duplicateCheck.rowCount > 0) {
        return { error: "Role with this name already exists" };
      }

      updateFields.push(`name = $${paramIndex}`);
      updateParams.push(name.trim());
      paramIndex++;
    }

    if (priority !== undefined) {
      // Validate priority
      if (typeof priority !== "number" || priority < 1) {
        return { error: "Priority must be a positive number" };
      }

      // Check if user updating the role has sufficient privileges
      if (updated_by) {
        const updaterPriority = await query("SELECT get_user_highest_priority($1) as priority", [updated_by]);

        const updaterHighestPriority = updaterPriority.rows[0].priority;

        // User can only update roles with lower priority than their own
        // And can only set priority to values lower than their own
        if (updaterHighestPriority >= currentRole.priority || updaterHighestPriority >= priority) {
          return {
            error: `Insufficient privileges: Cannot update role priority. Your highest priority: ${updaterHighestPriority}, Role priority: ${currentRole.priority}, New priority: ${priority}`,
          };
        }
      }

      updateFields.push(`priority = $${paramIndex}`);
      updateParams.push(priority);
      paramIndex++;
    }

    // Add updated_by and updated_at
    if (updated_by) {
      updateFields.push(`updated_by = $${paramIndex}`);
      updateParams.push(updated_by);
      paramIndex++;
    }

    updateFields.push(`updated_at = NOW()`);

    // Add role ID as the last parameter
    updateParams.push(roleId);

    // Execute update
    const updateQuery = `
      UPDATE roles 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateParams);
    const role = result.rows[0];

    // Revalidate cache
    revalidateTag(cache_key_roles);
    revalidateTag(cache_key_role(roleId));

    return {
      success: true,
      role,
      message: "Role updated successfully",
      changes: {
        name: name ? { from: currentRole.name, to: role.name } : undefined,
        priority: priority !== undefined ? { from: currentRole.priority, to: role.priority } : undefined,
      },
    };
  } catch (error) {
    console.error("Error updating role:", error);

    // Handle unique constraint violation
    if (error.code === "23505") {
      return { error: "Role with this name already exists" };
    }

    return { error: error.message || "Unknown database error" };
  }
}

export default updateRole;
