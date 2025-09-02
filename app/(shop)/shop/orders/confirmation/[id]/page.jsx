import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getOrder } from "@/data/dal/orders/get-order";
import { notFound } from "next/navigation";

export default async function OrderConfirmationPage({ params }) {
  const { id } = await params;
  const order = await getOrder(id);

  // If order is not found, show 404
  if (!order) {
    notFound();
  }

  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success mb-4">
          <CheckCircle className="h-8 w-8 text-success-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-success-foreground">Order Confirmed!</h1>
        <p className="text-muted-foreground mt-2">Thank you for your order. We have received your purchase request.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order #{order.order_number}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Order Information</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Order ID:</span> {order.id}
                </p>
                <p>
                  <span className="text-muted-foreground">Order Number:</span> {order.order_number}
                </p>
                <p>
                  <span className="text-muted-foreground">Date:</span> {order.created_date} at {order.created_time}
                </p>
                <p>
                  <span className="text-muted-foreground">Total:</span> Rs. {parseFloat(order.final_amount).toLocaleString()}
                </p>
                <p>
                  <span className="text-muted-foreground">Payment Method:</span>{" "}
                  {order.payment_method.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
                <p>
                  <span className="text-muted-foreground">Payment Status:</span> {order.payment_status}
                </p>
                <p>
                  <span className="text-muted-foreground">Order Status:</span> {order.order_status}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Customer Information</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Name:</span> {order.customer_name}
                </p>
                <p>
                  <span className="text-muted-foreground">Email:</span> {order.customer_email || "N/A"}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span> {order.customer_phone}
                </p>
              </div>

              <h3 className="font-medium mt-4 mb-2">Shipping Address</h3>
              <div className="text-sm space-y-1">
                <p>{order.shipping_address.line1}</p>
                {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-4">Order Summary</h3>
            <div className="space-y-4">
              {order.items &&
                order.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x Rs. {parseFloat(item.unit_price).toLocaleString()}
                        {item.size_code && ` - Size: ${item.size_code}`}
                      </p>
                    </div>
                    <p className="font-medium">Rs. {parseFloat(item.total_price).toLocaleString()}</p>
                  </div>
                ))}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>Rs. {parseFloat(order.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>Rs. {parseFloat(order.shipping_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>Rs. {parseFloat(order.tax_amount).toLocaleString()}</span>
                </div>
                {parseFloat(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>- Rs. {parseFloat(order.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-lg mt-2">
                  <span>Total</span>
                  <span>Rs. {parseFloat(order.final_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-4">What happens next?</h3>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-2">
                <span className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                <div>
                  <span className="font-medium">Order Processing</span>
                  <p className="text-muted-foreground">We're processing your order and will send you a confirmation email shortly.</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                <div>
                  <span className="font-medium">Shipping</span>
                  <p className="text-muted-foreground">
                    Your items will be prepared and shipped. You'll receive tracking information via email.
                  </p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                <div>
                  <span className="font-medium">Delivery</span>
                  <p className="text-muted-foreground">Your order will be delivered to your shipping address.</p>
                </div>
              </li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-end">
          <Button variant="outline" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
