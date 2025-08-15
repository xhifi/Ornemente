"use server";
import { query } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { products as cache_key_products, product as cache_key_product } from "@/cache_keys";
/**
 * Creates a new order in the database
 * @param {Object} orderData The order data from the checkout form
 * @returns {Promise<Object>} The created order with id and order_number
 */
const submitOrder = async (orderData) => {
  // Get client for transaction

  try {
    // Begin transaction
    await query("BEGIN");

    // Extract order details
    const {
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      billing_address,
      shipping_address,
      total_amount,
      discount_amount,
      shipping_amount,
      tax_amount,
      final_amount,
      notes,
      payment_method,
      payment_status,
      ip_address,
      user_agent,
      order_items,
    } = orderData;

    // 1. Insert the order
    const {
      rows: [order],
    } = await query(
      `
      INSERT INTO shop_orders (
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        billing_address,
        shipping_address,
        total_amount,
        discount_amount,
        shipping_amount,
        tax_amount,
        final_amount,
        notes,
        payment_method,
        payment_status,
        ip_address,
        user_agent
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING id, order_number
    `,
      [
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        JSON.stringify(billing_address),
        JSON.stringify(shipping_address),
        total_amount,
        discount_amount,
        shipping_amount,
        tax_amount,
        final_amount,
        notes,
        payment_method,
        payment_status,
        ip_address || "127.0.0.1", // Default IP if not provided
        user_agent,
      ]
    );

    // 2. Insert order items
    for (const item of order_items) {
      await query(
        `
        INSERT INTO shop_order_items (
          order_id,
          product_id,
          product_sku,
          product_name,
          size_code,
          quantity,
          unit_price,
          discount_amount,
          total_price,
          product_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
      `,
        [
          order.id,
          item.product_id,
          item.product_sku,
          item.product_name,
          item.size_code,
          item.quantity,
          item.unit_price,
          item.discount_amount,
          item.total_price,
          JSON.stringify(item.product_data),
        ]
      );

      // 3. Update stock
      try {
        await query(
          `
          UPDATE shop_product_sizes
          SET stock = stock - $1
          WHERE product_id = $2 AND size_id = $3
        `,
          [item.quantity, item.product_id, item.size_code]
        );
        revalidateTag(cache_key_product(item.product_id));
      } catch (stockError) {
        console.error("Failed to update stock for product", {
          productId: item.product_id,
          sizeCode: item.size_code,
          error: stockError.message,
        });
        // Continue processing even if stock update fails
        // This prevents order failure due to inventory issues
        // But logs the error for admin follow-up
      }
    }

    // 4. Commit the transaction
    await query("COMMIT");

    // 5. Revalidate relevant paths
    revalidateTag(cache_key_products);
    revalidatePath(`/shop/orders/${order.id}`);
    revalidatePath("/shop/cart");

    // 6. Clear cart cookie (optional alternative to client-side clearCart)
    // cookies().set('cart', '', { maxAge: 0 });

    return {
      success: true,
      id: order.id,
      order_number: order.order_number,
      message: "Order created successfully",
    };
  } catch (error) {
    // Rollback transaction if anything fails
    await query("ROLLBACK");
    console.error("Order creation error:", error);

    return {
      success: false,
      message: "Failed to create order",
      error: error.message,
    };
  }
};

export default submitOrder;
