import CheckoutForm from "@/components/forms/CheckoutForm";
import { Button } from "@/components/ui/button";

// This is now a server component
export default function CheckoutPage() {
  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* The CheckoutForm is a client component that contains all the form logic */}
      <CheckoutForm />
    </div>
  );
}
