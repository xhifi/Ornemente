"use server";

import { query } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { orders as cache_key_orders, order as cache_key_order } from "@/cache_keys";

const getOrders = unstable_cache(
  async ({ page = 1, limit = 10 } = {}) => {
    try {
      // Calculate offset for SQL pagination
      const offset = (page - 1) * limit;

      // Get paginated orders
      const orders = await query("SELECT * FROM shop_orders ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset]);

      // Get total count for pagination metadata
      const countResult = await query("SELECT COUNT(*) as total FROM shop_orders");
      const total = parseInt(countResult.rows[0]?.total || "0");

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      if (orders.rowCount === 0) {
        return {
          ok: true,
          data: [],
          metadata: {
            page,
            limit,
            total,
            totalPages,
          },
          error: null,
        };
      }

      return {
        ok: true,
        data: orders.rows,
        metadata: {
          page,
          limit,
          total,
          totalPages,
        },
        error: null,
      };
    } catch (error) {
      return {
        ok: false,
        data: null,
        metadata: null,
        error: error.message,
      };
    }
  },
  [cache_key_orders],
  {
    tags: [cache_key_orders],
    revalidate: 3600, // Cache for 3600 seconds
  }
);

export default getOrders;
