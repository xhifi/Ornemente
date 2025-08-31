"use server";

import { query } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { users as cache_key_users, roles as cache_key_roles } from "@/cache_keys";

/**
 * Remove a role from a user
 * @param {string} userId - The user ID
 * @param {string} roleId - The role ID to remove
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const removeRoleFromUser = async (userId, roleId) => {
  try {
    if (!userId || !roleId) {
      return {
        success: false,
        error: "User ID and Role ID are required",
      };
    }

    // Remove the role from user
    await query("DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2", [userId, roleId]);

    // Revalidate cache
    revalidateTag(cache_key_users);
    revalidateTag(cache_key_roles);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error removing role from user:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default removeRoleFromUser;
