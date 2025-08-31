import { query } from "@/lib/db";

// ========================
// Authentication & Authorization Middleware Utilities
// ========================

/**
 * Higher-order function that wraps a function with role-based access control
 * @param {Function} fn - The function to wrap
 * @param {Object} options - Authorization options
 * @param {string|string[]} [options.roles] - Required role(s)
 * @param {string|string[]} [options.permissions] - Required permission(s)
 * @param {Object} [options.permissionContext] - Context for permission checking
 * @param {string} [options.permissionContext.resource] - Resource name for permission check
 * @param {boolean} [options.requireAll=false] - Whether to require ALL roles/permissions (AND) or ANY (OR)
 * @param {string} [options.userIdParam='userId'] - Parameter name for user ID in function arguments
 * @param {Function} [options.getUserId] - Custom function to extract user ID from function arguments
 * @returns {Function} - Wrapped function with authorization
 */
export function withAuth(fn, options = {}) {
  return async function (...args) {
    try {
      const { roles, permissions, permissionContext = {}, requireAll = false, userIdParam = "userId", getUserId } = options;

      // Extract user ID from function arguments
      let userId;
      if (getUserId && typeof getUserId === "function") {
        userId = getUserId(...args);
      } else if (args[0] && typeof args[0] === "object" && args[0][userIdParam]) {
        userId = args[0][userIdParam];
      } else if (args[0] && typeof args[0] === "string") {
        userId = args[0];
      }

      if (!userId) {
        return {
          error: "Authentication required: User ID not found",
          code: "AUTH_REQUIRED",
        };
      }

      // Check roles if specified
      if (roles) {
        const roleCheck = await checkUserRoles(userId, roles, requireAll);
        if (!roleCheck.success) {
          return {
            error: `Access denied: ${roleCheck.error}`,
            code: "INSUFFICIENT_ROLES",
            required: roles,
            hasRoles: roleCheck.userRoles || [],
          };
        }
      }

      // Check permissions if specified
      if (permissions) {
        const permissionCheck = await checkUserPermissions(userId, permissions, permissionContext.resource, requireAll);
        if (!permissionCheck.success) {
          return {
            error: `Access denied: ${permissionCheck.error}`,
            code: "INSUFFICIENT_PERMISSIONS",
            required: permissions,
            resource: permissionContext.resource,
            hasPermissions: permissionCheck.userPermissions || [],
          };
        }
      }

      // If all checks pass, execute the original function
      return await fn(...args);
    } catch (error) {
      console.error("Authorization middleware error:", error);
      return {
        error: "Authorization check failed",
        code: "AUTH_ERROR",
        details: error.message,
      };
    }
  };
}

/**
 * Check if a user has specific role(s)
 * @param {string} userId - User ID
 * @param {string|string[]} requiredRoles - Role name(s) to check
 * @param {boolean} requireAll - Whether to require ALL roles (true) or ANY role (false)
 * @returns {Promise<Object>} - Result with success status and details
 */
export async function checkUserRoles(userId, requiredRoles, requireAll = false) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (rolesToCheck.length === 0) {
      return { success: true, userRoles: [] };
    }

    // Get user's roles using the database function
    const userRolesResult = await query("SELECT * FROM get_user_roles($1)", [userId]);

    const userRoles = userRolesResult.rows.map((row) => row.role_name);

    if (requireAll) {
      // User must have ALL required roles
      const missingRoles = rolesToCheck.filter((role) => !userRoles.includes(role));
      if (missingRoles.length > 0) {
        return {
          success: false,
          error: `Missing required roles: ${missingRoles.join(", ")}`,
          userRoles,
          missingRoles,
        };
      }
    } else {
      // User must have AT LEAST ONE of the required roles
      const hasAnyRole = rolesToCheck.some((role) => userRoles.includes(role));
      if (!hasAnyRole) {
        return {
          success: false,
          error: `User does not have any of the required roles: ${rolesToCheck.join(", ")}`,
          userRoles,
          requiredRoles: rolesToCheck,
        };
      }
    }

    return { success: true, userRoles };
  } catch (error) {
    console.error("Error checking user roles:", error);
    return { success: false, error: "Failed to check user roles" };
  }
}

/**
 * Check if a user has specific permission(s)
 * @param {string} userId - User ID
 * @param {string|string[]} requiredPermissions - Permission name(s) to check
 * @param {string} [resource] - Resource name for permission context
 * @param {boolean} requireAll - Whether to require ALL permissions (true) or ANY permission (false)
 * @returns {Promise<Object>} - Result with success status and details
 */
export async function checkUserPermissions(userId, requiredPermissions, resource = null, requireAll = false) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const permissionsToCheck = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    if (permissionsToCheck.length === 0) {
      return { success: true, userPermissions: [] };
    }

    if (resource) {
      // Check specific resource permissions
      const results = [];
      for (const permission of permissionsToCheck) {
        const result = await query("SELECT user_has_permission($1, $2, $3) as has_permission", [userId, resource, permission]);
        results.push({
          permission,
          resource,
          hasPermission: result.rows[0].has_permission,
        });
      }

      if (requireAll) {
        // User must have ALL required permissions
        const missingPermissions = results.filter((r) => !r.hasPermission);
        if (missingPermissions.length > 0) {
          return {
            success: false,
            error: `Missing required permissions on resource '${resource}': ${missingPermissions.map((p) => p.permission).join(", ")}`,
            userPermissions: results.filter((r) => r.hasPermission),
            missingPermissions: missingPermissions.map((p) => p.permission),
          };
        }
      } else {
        // User must have AT LEAST ONE of the required permissions
        const hasAnyPermission = results.some((r) => r.hasPermission);
        if (!hasAnyPermission) {
          return {
            success: false,
            error: `User does not have any of the required permissions on resource '${resource}': ${permissionsToCheck.join(", ")}`,
            userPermissions: [],
            requiredPermissions: permissionsToCheck,
          };
        }
      }

      return {
        success: true,
        userPermissions: results.filter((r) => r.hasPermission),
      };
    } else {
      // Check general permissions across all resources
      const userPermissionsResult = await query("SELECT * FROM get_user_permissions($1)", [userId]);

      const userPermissions = userPermissionsResult.rows.map((row) => ({
        permission: row.permission_name,
        resource: row.resource_name,
        role: row.role_name,
      }));

      const userPermissionNames = [...new Set(userPermissions.map((p) => p.permission))];

      if (requireAll) {
        // User must have ALL required permissions (on any resource)
        const missingPermissions = permissionsToCheck.filter((perm) => !userPermissionNames.includes(perm));
        if (missingPermissions.length > 0) {
          return {
            success: false,
            error: `Missing required permissions: ${missingPermissions.join(", ")}`,
            userPermissions: userPermissionNames,
            missingPermissions,
          };
        }
      } else {
        // User must have AT LEAST ONE of the required permissions
        const hasAnyPermission = permissionsToCheck.some((perm) => userPermissionNames.includes(perm));
        if (!hasAnyPermission) {
          return {
            success: false,
            error: `User does not have any of the required permissions: ${permissionsToCheck.join(", ")}`,
            userPermissions: userPermissionNames,
            requiredPermissions: permissionsToCheck,
          };
        }
      }

      return { success: true, userPermissions: userPermissionNames };
    }
  } catch (error) {
    console.error("Error checking user permissions:", error);
    return { success: false, error: "Failed to check user permissions" };
  }
}

/**
 * Check if a user can modify another user based on role hierarchy
 * @param {string} actingUserId - User performing the action
 * @param {string} targetUserId - User being modified
 * @returns {Promise<Object>} - Result with success status
 */
export async function checkUserHierarchy(actingUserId, targetUserId) {
  try {
    if (!actingUserId || !targetUserId) {
      return { success: false, error: "Both acting user ID and target user ID are required" };
    }

    // Users can always modify themselves
    if (actingUserId === targetUserId) {
      return { success: true, reason: "Self-modification allowed" };
    }

    const result = await query("SELECT user_can_modify_user($1, $2) as can_modify", [actingUserId, targetUserId]);

    const canModify = result.rows[0].can_modify;

    if (!canModify) {
      // Get priority information for better error message
      const priorityResult = await query(
        `SELECT 
          get_user_highest_priority($1) as acting_priority,
          get_user_highest_priority($2) as target_priority`,
        [actingUserId, targetUserId]
      );

      const { acting_priority, target_priority } = priorityResult.rows[0];

      return {
        success: false,
        error: `Insufficient privileges: Cannot modify user with equal or higher priority (Acting: ${acting_priority}, Target: ${target_priority})`,
        actingUserPriority: acting_priority,
        targetUserPriority: target_priority,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error checking user hierarchy:", error);
    return { success: false, error: "Failed to check user hierarchy" };
  }
}

/**
 * Middleware function for role-based access (decorator style)
 * @param {string|string[]} roles - Required role(s)
 * @param {boolean} requireAll - Whether to require ALL roles
 * @returns {Function} - Decorator function
 */
export const requireRoles = (roles, requireAll = false) => {
  return withAuth(null, { roles, requireAll });
};

/**
 * Middleware function for permission-based access (decorator style)
 * @param {string|string[]} permissions - Required permission(s)
 * @param {string} resource - Resource name
 * @param {boolean} requireAll - Whether to require ALL permissions
 * @returns {Function} - Decorator function
 */
export const requirePermissions = (permissions, resource = null, requireAll = false) => {
  return withAuth(null, {
    permissions,
    permissionContext: { resource },
    requireAll,
  });
};

/**
 * Check if a user has any role with specific permissions on a resource
 * @param {string} userId - User ID
 * @param {string|string[]} permissions - Permission(s) to check
 * @param {string} resource - Resource name
 * @param {boolean} requireAll - Whether to require ALL permissions (true) or ANY permission (false)
 * @returns {Promise<Object>} - Result with success status and details
 */
export async function checkUserHasRoleWithPermissions(userId, permissions, resource, requireAll = false) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    if (!resource) {
      return { success: false, error: "Resource is required" };
    }

    const permissionsToCheck = Array.isArray(permissions) ? permissions : [permissions];

    if (permissionsToCheck.length === 0) {
      return { success: true, matchingRoles: [] };
    }

    // Get all user permissions with role details
    const userPermissionsResult = await query("SELECT * FROM get_user_permissions($1)", [userId]);

    // Filter permissions for the specific resource
    const resourcePermissions = userPermissionsResult.rows.filter((row) => row.resource_name === resource);

    if (resourcePermissions.length === 0) {
      return {
        success: false,
        error: `User has no permissions on resource '${resource}'`,
        userPermissions: [],
        requiredPermissions: permissionsToCheck,
        resource,
      };
    }

    // Group permissions by role
    const rolePermissions = {};
    resourcePermissions.forEach((row) => {
      if (!rolePermissions[row.role_name]) {
        rolePermissions[row.role_name] = [];
      }
      rolePermissions[row.role_name].push(row.permission_name);
    });

    // Find roles that have the required permissions
    const matchingRoles = [];
    for (const [roleName, rolePerms] of Object.entries(rolePermissions)) {
      if (requireAll) {
        // Role must have ALL required permissions
        const hasAllPermissions = permissionsToCheck.every((perm) => rolePerms.includes(perm));
        if (hasAllPermissions) {
          matchingRoles.push({
            role: roleName,
            permissions: rolePerms.filter((perm) => permissionsToCheck.includes(perm)),
          });
        }
      } else {
        // Role must have AT LEAST ONE required permission
        const hasAnyPermission = permissionsToCheck.some((perm) => rolePerms.includes(perm));
        if (hasAnyPermission) {
          matchingRoles.push({
            role: roleName,
            permissions: rolePerms.filter((perm) => permissionsToCheck.includes(perm)),
          });
        }
      }
    }

    if (matchingRoles.length === 0) {
      const logicType = requireAll ? "ALL" : "ANY";
      return {
        success: false,
        error: `User does not have any role with ${logicType} of the required permissions on resource '${resource}': ${permissionsToCheck.join(", ")}`,
        userRoles: Object.keys(rolePermissions),
        requiredPermissions: permissionsToCheck,
        resource,
        requireAll,
      };
    }

    return {
      success: true,
      matchingRoles,
      resource,
      requiredPermissions: permissionsToCheck,
      requireAll,
    };
  } catch (error) {
    console.error("Error checking user role permissions:", error);
    return { success: false, error: "Failed to check user role permissions" };
  }
}

/**
 * Check if a user has specific roles OR specific permissions on a resource
 * This allows for flexible authorization where a user can pass either by having certain roles
 * OR by having certain permissions on a specific resource
 * @param {string} userId - User ID
 * @param {Object} criteria - Authorization criteria
 * @param {string|string[]} [criteria.roles] - Required role(s) (OR condition)
 * @param {string|string[]} [criteria.permissions] - Required permission(s) (OR condition with roles)
 * @param {string} [criteria.resource] - Resource name for permission check
 * @param {boolean} [criteria.requireAllRoles=false] - Whether to require ALL roles (if checking roles)
 * @param {boolean} [criteria.requireAllPermissions=false] - Whether to require ALL permissions (if checking permissions)
 * @returns {Promise<Object>} - Result with success status and details
 */
export async function checkUserRolesOrPermissions(userId, criteria) {
  try {
    const { roles, permissions, resource, requireAllRoles = false, requireAllPermissions = false } = criteria;

    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    if (!roles && !permissions) {
      return { success: false, error: "Either roles or permissions must be specified" };
    }

    const results = {
      roleCheck: null,
      permissionCheck: null,
      passedBy: null,
    };

    // Check roles if specified
    if (roles) {
      results.roleCheck = await checkUserRoles(userId, roles, requireAllRoles);
      if (results.roleCheck.success) {
        results.passedBy = "roles";
        return {
          success: true,
          passedBy: "roles",
          roleCheck: results.roleCheck,
          message: `Access granted through roles: ${results.roleCheck.userRoles.join(", ")}`,
        };
      }
    }

    // Check permissions if specified
    if (permissions) {
      if (resource) {
        // Check specific resource permissions
        results.permissionCheck = await checkUserPermissions(userId, permissions, resource, requireAllPermissions);
      } else {
        // Check general permissions
        results.permissionCheck = await checkUserPermissions(userId, permissions, null, requireAllPermissions);
      }

      if (results.permissionCheck.success) {
        results.passedBy = "permissions";
        return {
          success: true,
          passedBy: "permissions",
          permissionCheck: results.permissionCheck,
          resource,
          message: `Access granted through permissions on ${resource || "any resource"}`,
        };
      }
    }

    // If neither passed, return detailed error
    const errors = [];
    if (results.roleCheck && !results.roleCheck.success) {
      errors.push(`Roles: ${results.roleCheck.error}`);
    }
    if (results.permissionCheck && !results.permissionCheck.success) {
      errors.push(`Permissions: ${results.permissionCheck.error}`);
    }

    return {
      success: false,
      error: `Access denied. ${errors.join(" AND ")}`,
      roleCheck: results.roleCheck,
      permissionCheck: results.permissionCheck,
      requiredRoles: roles,
      requiredPermissions: permissions,
      resource,
    };
  } catch (error) {
    console.error("Error checking user roles or permissions:", error);
    return { success: false, error: "Failed to check user authorization" };
  }
}

/**
 * Advanced authorization function that checks if user has any role that contains
 * specific permissions on multiple resources
 * @param {string} userId - User ID
 * @param {Array} resourcePermissions - Array of {resource, permissions} objects
 * @param {boolean} requireAll - Whether user must have permissions on ALL resources (true) or ANY resource (false)
 * @param {boolean} requireAllPermissions - Whether user must have ALL permissions per resource
 * @returns {Promise<Object>} - Result with success status and details
 */
export async function checkUserMultiResourcePermissions(userId, resourcePermissions, requireAll = false, requireAllPermissions = false) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    if (!Array.isArray(resourcePermissions) || resourcePermissions.length === 0) {
      return { success: false, error: "Resource permissions array is required" };
    }

    // Validate input format
    for (const rp of resourcePermissions) {
      if (!rp.resource || !rp.permissions) {
        return { success: false, error: "Each resource permission object must have 'resource' and 'permissions' properties" };
      }
    }

    const results = [];

    // Check each resource-permission combination
    for (const { resource, permissions } of resourcePermissions) {
      const check = await checkUserHasRoleWithPermissions(userId, permissions, resource, requireAllPermissions);
      results.push({
        resource,
        permissions: Array.isArray(permissions) ? permissions : [permissions],
        success: check.success,
        matchingRoles: check.matchingRoles || [],
        error: check.error,
      });
    }

    const successfulChecks = results.filter((r) => r.success);

    if (requireAll) {
      // User must have permissions on ALL specified resources
      if (successfulChecks.length !== resourcePermissions.length) {
        const failedResources = results.filter((r) => !r.success).map((r) => r.resource);
        return {
          success: false,
          error: `Missing required permissions on resources: ${failedResources.join(", ")}`,
          results,
          failedResources,
          successfulResources: successfulChecks.map((r) => r.resource),
        };
      }
    } else {
      // User must have permissions on AT LEAST ONE resource
      if (successfulChecks.length === 0) {
        return {
          success: false,
          error: `User does not have required permissions on any of the specified resources`,
          results,
          requiredResources: resourcePermissions.map((rp) => rp.resource),
        };
      }
    }

    return {
      success: true,
      results,
      successfulResources: successfulChecks.map((r) => r.resource),
      matchingRoles: [...new Set(successfulChecks.flatMap((r) => r.matchingRoles.map((mr) => mr.role)))],
      requireAll,
      requireAllPermissions,
    };
  } catch (error) {
    console.error("Error checking multi-resource permissions:", error);
    return { success: false, error: "Failed to check multi-resource permissions" };
  }
}

/**
 * Enhanced withAuth function with more flexible authorization options
 * @param {Function} fn - The function to wrap
 * @param {Object} options - Authorization options
 * @param {string|string[]} [options.roles] - Required role(s)
 * @param {string|string[]} [options.permissions] - Required permission(s)
 * @param {string} [options.resource] - Resource name for permission check
 * @param {Array} [options.multiResourcePermissions] - Array of {resource, permissions} for multi-resource checks
 * @param {boolean} [options.requireAll=false] - Whether to require ALL roles/permissions/resources
 * @param {boolean} [options.requireAllPermissions=false] - Whether to require ALL permissions per resource
 * @param {boolean} [options.useOrLogic=false] - Use OR logic between roles and permissions
 * @param {string} [options.userIdParam='userId'] - Parameter name for user ID
 * @param {Function} [options.getUserId] - Custom function to extract user ID
 * @returns {Function} - Wrapped function with enhanced authorization
 */
export function withEnhancedAuth(fn, options = {}) {
  return async function (...args) {
    try {
      const {
        roles,
        permissions,
        resource,
        multiResourcePermissions,
        requireAll = false,
        requireAllPermissions = false,
        useOrLogic = false,
        userIdParam = "userId",
        getUserId,
      } = options;

      // Extract user ID from function arguments
      let userId;
      if (getUserId && typeof getUserId === "function") {
        userId = getUserId(...args);
      } else if (args[0] && typeof args[0] === "object" && args[0][userIdParam]) {
        userId = args[0][userIdParam];
      } else if (args[0] && typeof args[0] === "string") {
        userId = args[0];
      }

      if (!userId) {
        return {
          error: "Authentication required: User ID not found",
          code: "AUTH_REQUIRED",
        };
      }

      // Handle multi-resource permissions
      if (multiResourcePermissions) {
        const multiCheck = await checkUserMultiResourcePermissions(userId, multiResourcePermissions, requireAll, requireAllPermissions);
        if (!multiCheck.success) {
          return {
            error: `Access denied: ${multiCheck.error}`,
            code: "INSUFFICIENT_MULTI_RESOURCE_PERMISSIONS",
            details: multiCheck.results,
            required: multiResourcePermissions,
          };
        }
      }

      // Handle OR logic between roles and permissions
      if (useOrLogic && roles && permissions) {
        const orCheck = await checkUserRolesOrPermissions(userId, {
          roles,
          permissions,
          resource,
          requireAllRoles: requireAll,
          requireAllPermissions: requireAll,
        });
        if (!orCheck.success) {
          return {
            error: `Access denied: ${orCheck.error}`,
            code: "INSUFFICIENT_ROLES_OR_PERMISSIONS",
            roleCheck: orCheck.roleCheck,
            permissionCheck: orCheck.permissionCheck,
            required: { roles, permissions, resource },
          };
        }
      } else {
        // Original logic - both roles AND permissions must pass if specified
        if (roles) {
          const roleCheck = await checkUserRoles(userId, roles, requireAll);
          if (!roleCheck.success) {
            return {
              error: `Access denied: ${roleCheck.error}`,
              code: "INSUFFICIENT_ROLES",
              required: roles,
              hasRoles: roleCheck.userRoles || [],
            };
          }
        }

        if (permissions) {
          const permissionCheck = await checkUserPermissions(userId, permissions, resource, requireAll);
          if (!permissionCheck.success) {
            return {
              error: `Access denied: ${permissionCheck.error}`,
              code: "INSUFFICIENT_PERMISSIONS",
              required: permissions,
              resource,
              hasPermissions: permissionCheck.userPermissions || [],
            };
          }
        }
      }

      // If all checks pass, execute the original function
      return await fn(...args);
    } catch (error) {
      console.error("Enhanced authorization middleware error:", error);
      return {
        error: "Authorization check failed",
        code: "AUTH_ERROR",
        details: error.message,
      };
    }
  };
}
