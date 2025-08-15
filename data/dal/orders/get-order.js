"use server";
import { query } from "@/lib/db";

/**
 * Get order details by ID
 * @param {number|string} id - The order ID
 * @returns {Promise<Object|null>} - The order details or null if not found
 */
export async function getOrder(id) {
  try {
    // Convert id to number if it's a string
    const orderId = typeof id === "string" ? parseInt(id, 10) : id;

    // Get the order details
    const {
      rows: [order],
    } = await query(
      `
      SELECT 
        o.*,
        to_char(o.created_at, 'Mon DD, YYYY') as created_date,
        to_char(o.created_at, 'HH24:MI') as created_time
      FROM shop_orders o
      WHERE o.id = $1
    `,
      [orderId]
    );

    if (!order) {
      throw new Error("Order not found");
    }

    // Get the order items
    const { rows: orderItems } = await query(
      `
      SELECT * FROM shop_order_items 
      WHERE order_id = $1 
      ORDER BY id
    `,
      [orderId]
    );

    // Combine order and items
    return {
      ...order,
      items: orderItems,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    throw new Error("Failed to fetch order details");
  }
}
