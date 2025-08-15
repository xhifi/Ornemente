"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { toast } from "sonner";
import submitOrder from "@/data/dal/orders/submit-order";
import Image from "next/image";
import { generateThumbnailURL } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle, AlertCircle, MapPin, Truck, CreditCard } from "lucide-react";

// Zod validation schema
const formSchema = z
  .object({
    // Customer Information
    customer_name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    customer_email: z
      .string()
      .email({
        message: "Please enter a valid email address.",
      })
      .optional(),
    customer_phone: z.string().min(10, {
      message: "Please enter a valid phone number.",
    }),

    // Billing Address
    billing_address_line1: z.string().min(5, {
      message: "Address must be at least 5 characters.",
    }),
    billing_address_line2: z.string().optional(),
    billing_city: z.string().min(2, {
      message: "City is required.",
    }),
    billing_state: z.string().min(2, {
      message: "Province/State is required.",
    }),
    billing_postal_code: z.string().min(4, {
      message: "Postal code is required.",
    }),

    // Shipping Address toggle
    same_as_billing: z.boolean().default(true),

    // Payment Information
    payment_method: z.enum(["cash_on_delivery", "credit_card", "bank_transfer"]),

    // Additional
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Only validate shipping fields if same_as_billing is false
    if (!data.same_as_billing) {
      // Check shipping_address_line1
      if (!data.shipping_address_line1 || data.shipping_address_line1.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 5,
          type: "string",
          inclusive: true,
          message: "Address must be at least 5 characters.",
          path: ["shipping_address_line1"],
        });
      }

      // Check shipping_city
      if (!data.shipping_city || data.shipping_city.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 2,
          type: "string",
          inclusive: true,
          message: "City is required.",
          path: ["shipping_city"],
        });
      }

      // Check shipping_state
      if (!data.shipping_state || data.shipping_state.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 2,
          type: "string",
          inclusive: true,
          message: "Province/State is required.",
          path: ["shipping_state"],
        });
      }

      // Check shipping_postal_code
      if (!data.shipping_postal_code || data.shipping_postal_code.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 4,
          type: "string",
          inclusive: true,
          message: "Postal code is required.",
          path: ["shipping_postal_code"],
        });
      }
    }
  });

export default function CheckoutForm() {
  const router = useRouter();
  const { cart, clearCart, totalPrice } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingCost, setShippingCost] = useState(250); // Default shipping cost

  // Calculate subtotal, tax, and total
  const subtotal = cart.reduce((total, item) => {
    const discountedPrice =
      item.discount > 0 ? Math.round(item.original_price - (item.discount * item.original_price) / 100) : item.original_price;
    return total + discountedPrice * item.quantity;
  }, 0);

  const taxRate = 0.18; // 18% tax rate
  const taxAmount = totalPrice * taxRate;
  const totalAmount = totalPrice + taxAmount + shippingCost;

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "all", // Validate on all interactions for maximum feedback
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      billing_address_line1: "",
      billing_address_line2: "",
      billing_city: "",
      billing_state: "",
      billing_postal_code: "",
      same_as_billing: true,
      shipping_address_line1: "",
      shipping_address_line2: "",
      shipping_city: "",
      shipping_state: "",
      shipping_postal_code: "",
      payment_method: "cash_on_delivery",
      notes: "",
    },
    // Skip validation for shipping fields when same_as_billing is true
    shouldUnregister: false,
  });

  // Handle form submission - simplified and improved error handling
  const onSubmit = async (data) => {
    console.log(`SUBMITTING FORM`, data);

    if (!data) {
      toast.error("Form data missing", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    // Check form validity
    const isValid = await form.trigger();

    if (!isValid) {
      // Show error toast
      toast.error("Form has validation errors", {
        description: "Please fill in all required fields correctly.",
      });

      // Scroll to the first error field
      const firstErrorFieldName = Object.keys(form.formState.errors)[0];
      const firstErrorElement = document.querySelector(`[name="${firstErrorFieldName}"]`);
      if (firstErrorElement) {
        setTimeout(() => {
          firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          firstErrorElement.focus();
        }, 100);
      }

      return; // Don't proceed with submission
    }

    // Set submitting state
    setIsSubmitting(true);

    try {
      // Prepare billing address in JSONB format
      const billingAddress = {
        line1: data.billing_address_line1,
        line2: data.billing_address_line2 || "",
        city: data.billing_city,
        state: data.billing_state,
        postal_code: data.billing_postal_code,
        country: "Pakistan", // Default country
      };

      // Prepare shipping address
      const shippingAddress = data.same_as_billing
        ? billingAddress
        : {
            line1: data.shipping_address_line1,
            line2: data.shipping_address_line2 || "",
            city: data.shipping_city,
            state: data.shipping_state,
            postal_code: data.shipping_postal_code,
            country: "Pakistan", // Default country
          };

      // Prepare order items
      const orderItems = cart.map((item) => ({
        product_id: item.product_id,
        product_sku: item.sku,
        product_name: item.name,
        size_code: item.selected_size,
        quantity: item.selected_quantity,
        unit_price: item.discount > 0 ? item.discounted_price : item.original_price,
        discount_amount: item.discount > 0 ? Math.round((item.discount * item.original_price) / 100) * item.selected_quantity : 0,
        total_price:
          item.discount > 0
            ? Math.round(item.discounted_price * item.selected_quantity)
            : Math.round(item.original_price * item.selected_quantity),
        product_data: {
          brand: item.brand_name,
          collection: item.collection,
          original_price: item.original_price,
          discount: item.discount,
          images: item.image,
        },
      }));

      // Create order object
      const order = {
        user_id: null, // Anonymous checkout
        customer_name: data.customer_name,
        customer_email: data.customer_email || "",
        customer_phone: data.customer_phone,
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        total_amount: totalPrice,
        discount_amount: 0, // No additional discounts in this example
        shipping_amount: shippingCost,
        tax_amount: taxAmount,
        final_amount: totalAmount,
        notes: data.notes || "",
        payment_method: data.payment_method,
        payment_status: "pending",
        ip_address: "", // Would be set server-side
        user_agent: navigator.userAgent,
        order_items: orderItems,
      };

      // Call the server action directly
      const result = await submitOrder(order);

      if (result && result.success) {
        // Clear the cart
        clearCart();

        // Show success message
        toast.success("Order placed successfully!", {
          description: `Order #${result.order_number} has been created.`,
        });

        // Redirect to order confirmation page
        router.push(`/shop/orders/confirmation/${result.id}`);
      } else {
        throw new Error(result?.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Order submission failed:", error);
      toast.error("Failed to place order", {
        description: error.message || "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch for changes to same_as_billing checkbox and other fields
  const sameAsBilling = form.watch("same_as_billing");
  const billingAddressLine1 = form.watch("billing_address_line1");
  const billingAddressLine2 = form.watch("billing_address_line2");
  const billingCity = form.watch("billing_city");
  const billingState = form.watch("billing_state");
  const billingPostalCode = form.watch("billing_postal_code");

  // Update shipping fields when same_as_billing changes or when billing fields change while same_as_billing is true
  useEffect(() => {
    if (sameAsBilling) {
      // Clear any validation errors for shipping fields
      form.clearErrors(["shipping_address_line1", "shipping_city", "shipping_state", "shipping_postal_code"]);

      // Copy billing address to shipping fields in the form data
      form.setValue("shipping_address_line1", billingAddressLine1);
      form.setValue("shipping_address_line2", billingAddressLine2);
      form.setValue("shipping_city", billingCity);
      form.setValue("shipping_state", billingState);
      form.setValue("shipping_postal_code", billingPostalCode);
    }
  }, [sameAsBilling, form, billingAddressLine1, billingAddressLine2, billingCity, billingState, billingPostalCode]);

  // Empty cart check moved to page component
  if (cart.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg mb-4">Your cart is empty.</p>
        <Button asChild>
          <a href="/shop">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Form */}
      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="p-4 mb-4 rounded-md bg-destructive/10 border border-destructive">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h3 className="font-medium text-destructive">There are errors in your form</h3>
                    <ul className="mt-1 list-disc list-inside text-sm text-destructive space-y-1">
                      {Object.entries(form.formState.errors).map(([key, error]) => (
                        <li key={key}>{error?.message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                  Customer Information
                </CardTitle>
                <CardDescription>Please provide your contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage className="text-destructive font-medium" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customer_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number*</FormLabel>
                        <FormControl>
                          <Input placeholder="+92 3XX XXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  Billing Address
                </CardTitle>
                <CardDescription>Enter your billing address information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="billing_address_line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1*</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address, P.O. box, company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billing_address_line2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Apartment, suite, unit, building, floor, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="billing_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City*</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billing_state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Province/State*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select province" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="punjab">Punjab</SelectItem>
                            <SelectItem value="sindh">Sindh</SelectItem>
                            <SelectItem value="kpk">Khyber Pakhtunkhwa</SelectItem>
                            <SelectItem value="balochistan">Balochistan</SelectItem>
                            <SelectItem value="islamabad">Islamabad Capital Territory</SelectItem>
                            <SelectItem value="gilgit_baltistan">Gilgit-Baltistan</SelectItem>
                            <SelectItem value="ajk">Azad Jammu & Kashmir</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billing_postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code*</FormLabel>
                        <FormControl>
                          <Input placeholder="Postal Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-primary" />
                  Shipping Address
                </CardTitle>
                <CardDescription>Where should we deliver your order?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="same_as_billing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Same as billing address</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {!sameAsBilling && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="shipping_address_line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1*</FormLabel>
                          <FormControl>
                            <Input placeholder="Street address, P.O. box, company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shipping_address_line2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Apartment, suite, unit, building, floor, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="shipping_city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City*</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shipping_state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Province/State*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="punjab">Punjab</SelectItem>
                                <SelectItem value="sindh">Sindh</SelectItem>
                                <SelectItem value="kpk">Khyber Pakhtunkhwa</SelectItem>
                                <SelectItem value="balochistan">Balochistan</SelectItem>
                                <SelectItem value="islamabad">Islamabad Capital Territory</SelectItem>
                                <SelectItem value="gilgit_baltistan">Gilgit-Baltistan</SelectItem>
                                <SelectItem value="ajk">Azad Jammu & Kashmir</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shipping_postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code*</FormLabel>
                            <FormControl>
                              <Input placeholder="Postal Code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-primary" />
                  Payment Method
                </CardTitle>
                <CardDescription>Choose how you want to pay</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-3">
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="cash_on_delivery" />
                            </FormControl>
                            <FormLabel className="font-normal">Cash on Delivery</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="credit_card" />
                            </FormControl>
                            <FormLabel className="font-normal">Credit Card (Pay now)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="bank_transfer" />
                            </FormControl>
                            <FormLabel className="font-normal">Bank Transfer</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
                <CardDescription>Add any special instructions or notes about your order</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Special delivery instructions or notes about your order"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Place Order"}
              </Button>

              {/* Debug button to test form validation state */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="sm"
                onClick={async () => {
                  console.log("Debug button clicked");
                  console.log("Form state:", form.getValues());

                  // Log current form state
                  console.log("Form state details:", {
                    isValid: form.formState.isValid,
                    errors: form.formState.errors,
                  });

                  // Force validate all fields
                  const isValid = await form.trigger();
                  console.log("Manual validation result:", isValid);

                  if (!isValid) {
                    console.log("Validation errors:", form.formState.errors);

                    // Scroll to the first error field
                    const firstErrorFieldName = Object.keys(form.formState.errors)[0];
                    const firstErrorElement = document.querySelector(`[name="${firstErrorFieldName}"]`);
                    if (firstErrorElement) {
                      firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
                      firstErrorElement.focus();
                    }

                    toast.error("Form has validation errors", {
                      description: "Please fill in all required fields correctly.",
                    });
                  } else {
                    // If valid, test the server action with a sample order
                    console.log("Form is valid, testing server action");
                    const formData = form.getValues();

                    try {
                      // Simple test order
                      const testOrder = {
                        user_id: null,
                        customer_name: formData.customer_name,
                        customer_email: formData.customer_email || "",
                        customer_phone: formData.customer_phone,
                        billing_address: {
                          line1: formData.billing_address_line1,
                          city: formData.billing_city,
                          state: formData.billing_state,
                          postal_code: formData.billing_postal_code,
                          country: "Pakistan",
                        },
                        shipping_address: {
                          line1: formData.billing_address_line1,
                          city: formData.billing_city,
                          state: formData.billing_state,
                          postal_code: formData.billing_postal_code,
                          country: "Pakistan",
                        },
                        total_amount: 1000,
                        discount_amount: 0,
                        shipping_amount: 250,
                        tax_amount: 50,
                        final_amount: 1300,
                        notes: formData.notes || "",
                        payment_method: formData.payment_method,
                        payment_status: "pending",
                        ip_address: "",
                        user_agent: navigator.userAgent,
                        order_items: [
                          {
                            product_id: 1,
                            product_sku: "TEST-SKU",
                            product_name: "Test Product",
                            size_code: "M",
                            quantity: 1,
                            unit_price: 1000,
                            discount_amount: 0,
                            total_price: 1000,
                            product_data: {},
                          },
                        ],
                      };

                      toast.info("Testing server action", {
                        description: "Creating a test order",
                      });

                      const result = await submitOrder(testOrder);

                      if (result && result.success) {
                        toast.success("Test order created successfully", {
                          description: `Order #${result.order_number} has been created.`,
                        });
                      } else {
                        throw new Error(result?.message || "Test order failed");
                      }
                    } catch (error) {
                      toast.error("Test order failed", {
                        description: error.message,
                      });
                    }
                  }
                }}
              >
                Test Form Validation
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>
              {cart.length} {cart.length === 1 ? "item" : "items"} in your cart
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-64 overflow-auto space-y-3">
              {cart.map((item, index) => {
                console.log(`ITEM IN CART`, item);
                const discountedPrice =
                  item.discount > 0 ? Math.round(item.original_price - (item.discount * item.original_price) / 100) : item.original_price;

                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="relative h-16 w-16">
                      <Image src={generateThumbnailURL(item.image.key)} alt={item.name} fill className="object-cover rounded" />
                      <span className="absolute -top-2 -right-2 bg-primary text-secondary rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {item.selected_quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">Size: {item.selected_size}</p>
                      <div className="text-sm">
                        {item.discount === 0 ? (
                          <span>Rs. {item.original_price?.toLocaleString()}</span>
                        ) : (
                          <span>Rs. {item.discounted_price?.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        Rs.{" "}
                        {item.discount === 0
                          ? (item.original_price * item.selected_quantity)?.toLocaleString()
                          : (item.discounted_price * item.selected_quantity)?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs. {totalPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Rs. {shippingCost?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (18%)</span>
                <span>Rs. {taxAmount?.toLocaleString()}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>Rs. {Math.round(totalAmount)?.toLocaleString()}</span>
            </div>

            <div className="p-3 bg-muted rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <p className="text-sm">Your order will be processed after confirmation.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
