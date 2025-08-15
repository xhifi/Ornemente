import { NextResponse } from "next/server";

/**
 * This API route is deprecated.
 * Order submission is now handled by the server action in /data/dal/orders/submit-order.js
 */
export async function POST(request) {
  console.warn("Deprecated API route /api/orders was called. Use server actions instead.");
  
  // Return a deprecated status code
  return NextResponse.json(
    { 
      success: false, 
      message: "This API endpoint is deprecated. Use server actions instead." 
    }, 
    { status: 410 } // 410 Gone status code
  );
}
    
    try {
      // 1. Insert the order
      const { rows: [order] } = await sql`
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
          NULL,
          ${customer_name},
          ${customer_email},
          ${customer_phone},
          ${JSON.stringify(billing_address)},
          ${JSON.stringify(shipping_address)},
          ${total_amount},
          ${discount_amount},
          ${shipping_amount},
          ${tax_amount},
          ${final_amount},
          ${notes},
          ${payment_method},
          ${payment_status},
          ${ip_address},
          ${user_agent}
        )
        RETURNING id, order_number
      `;
      
      // 2. Insert order items
      for (const item of order_items) {
        await sql`
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
            ${order.id},
            ${item.product_id},
            ${item.product_sku},
            ${item.product_name},
            ${item.size_code},
            ${item.quantity},
            ${item.unit_price},
            ${item.discount_amount},
            ${item.total_price},
            ${JSON.stringify(item.product_data)}
          )
        `;
        
        // 3. Update stock (optional, depends on your business logic)
        await sql`
          UPDATE shop_product_sizes
          SET stock = stock - ${item.quantity}
          WHERE product_id = ${item.product_id} AND size_id = ${item.size_code}
        `;
      }
      
      // 4. Commit the transaction
      await sql`COMMIT`;
      
      // 5. Return success response
      return NextResponse.json({
        success: true,
        id: order.id,
        order_number: order.order_number,
        message: "Order created successfully"
      });
      
    } catch (error) {
      // Rollback transaction if anything fails
      await sql`ROLLBACK`;
      throw error; // Re-throw for outer catch
    }
    
  } catch (error) {
    console.error("Order creation error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to create order", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
