"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { users as cache_key_users } from "@/cache_keys";

/**
 * Get all users with their roles
 * @param {Object} options - Options for pagination and filtering
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=50] - Items per page
 * @param {string} [options.search=""] - Search term for name or email
 * @returns {Promise<Object>} - List of users with roles
 */
const getAllUsers = unstable_cache(
  async ({ page = 1, limit = 50, search = "" } = {}) => {
    try {
      const offset = (page - 1) * limit;
      const params = [];
      let paramIndex = 1;

      // Base query to get users with their role information
      let queryText = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.email_verified,
          u.phone,
          u.created_at,
          u.updated_at,
          COALESCE(
            JSON_AGG(
              CASE 
                WHEN r.id IS NOT NULL THEN 
                  JSON_BUILD_OBJECT(
                    'role_id', r.id,
                    'role_name', r.name,
                    'role_priority', r.priority,
                    'assigned_at', ur.assigned_at,
                    'expires_at', ur.expires_at
                  )
                ELSE NULL
              END
            ) FILTER (WHERE r.id IS NOT NULL), 
            '[]'::json
          ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id 
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE 1=1
      `;

      // Add search condition
      if (search) {
        queryText += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Group by user and add pagination
      queryText += `
        GROUP BY u.id, u.name, u.email, u.email_verified, u.phone, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const result = await query(queryText, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(DISTINCT u.id) as total 
        FROM users u
        WHERE 1=1
      `;

      const countParams = [];
      let countParamIndex = 1;

      if (search) {
        countQuery += ` AND (u.name ILIKE $${countParamIndex} OR u.email ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }

      const countResult = await query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      const users = result.rows.map((user) => ({
        ...user,
        roles: Array.isArray(user.roles) ? user.roles : [],
        highestPriority: user.roles && user.roles.length > 0 ? Math.min(...user.roles.map((r) => r.role_priority)) : 999,
      }));

      return {
        success: true,
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error getting users:", error);
      return { error: error.message || "Unknown database error" };
    }
  },
  [cache_key_users],
  {
    tags: [cache_key_users],
    revalidate: 3600,
  }
);

export default getAllUsers;
