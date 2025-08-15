import getOrders from "@/data/dal/orders/get-orders";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const paymentMethods = {
  cash_on_delivery: "Cash on Delivery",
};

const OrdersPage = async () => {
  const orders = await getOrders();

  return (
    <Table>
      <TableCaption>List of Orders</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Order Number</TableHead>
          <TableHead>Customer Phone</TableHead>
          <TableHead>Customer Email</TableHead>
          <TableHead>Street Address</TableHead>
          <TableHead>Street Address 2</TableHead>
          <TableHead>City</TableHead>
          <TableHead>State</TableHead>
          <TableHead>P.O. Box</TableHead>
          <TableHead>Collectable Amount</TableHead>
          <TableHead>Tax Amount</TableHead>
          <TableHead>Order Status</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Payment Status</TableHead>
          <TableHead>Order Placed On</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.data.map((order) => (
          <TableRow key={order.order_number}>
            <TableCell>{order.order_number}</TableCell>
            <TableCell>{order.customer_phone}</TableCell>
            <TableCell>{order.customer_email}</TableCell>
            <TableCell>{`${order.shipping_address?.line1}`}</TableCell>
            <TableCell>{`${order.shipping_address?.line2}`}</TableCell>
            <TableCell>{`${order.shipping_address?.city}`}</TableCell>
            <TableCell>{`${order.shipping_address?.state}`}</TableCell>
            <TableCell>{`${order.shipping_address?.postal_code}`}</TableCell>
            <TableCell>{order.final_amount}</TableCell>
            <TableCell>{order.tax_amount}</TableCell>
            <TableCell>{order.order_status}</TableCell>
            <TableCell>{paymentMethods[order.payment_method] || order.payment_method}</TableCell>
            <TableCell>{order.payment_status}</TableCell>
            <TableCell>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(order.created_at))}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OrdersPage;
