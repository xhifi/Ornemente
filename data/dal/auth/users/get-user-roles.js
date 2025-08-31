"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { role as cache_key_role, roles as cache_key_roles, user as cache_key_user, users as cache_key_users } from "@/cache_keys";

/**
 * Get all roles assigned to a specific user
 * @param {string} userId - The user ID to get roles for
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
const getUserRoles = (userId) => {
  return unstable_cache(
    async () => {
      try {
        if (!userId) {
          return {
            success: false,
            error: "User ID is required",
          };
        }

        // Use the get_user_roles() SQL function
        const result = await query(`SELECT * FROM get_user_roles($1) ORDER BY role_priority ASC, role_name ASC`, [userId]);

        return {
          success: true,
          data: result.rows,
        };
      } catch (error) {
        console.error("Error fetching user roles:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [cache_key_user(userId), cache_key_roles],
    {
      tags: [cache_key_user(userId), cache_key_roles],
      revalidate: 3600,
    }
  )();
};

export default getUserRoles;
