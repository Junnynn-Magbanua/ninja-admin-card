import { useState } from "react";
import { NinjaLogo } from "@/components/ui/ninja-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { ShieldCheckIcon, SearchIcon, CreditCardIcon, PackageIcon, AlertCircleIcon } from "lucide-react";
import { stickyIOService, type OrderLookupResponse } from "@/services/stickyio";

interface Product {
  id: string;
  offer_id: string;
  product_id: string; // Added: Sticky.io product_id (different from offer_id)
  name: string;
  price: number;
  description: string;
  billing_models: {
    id: string;
    name: string;
    type: 'recurring' | 'one_time';
    rebill_amount?: number;
  }[];
}

// Products mapped to Sticky.io with correct IDs
const PRODUCTS: Product[] = [
  {
    id: "1",
    product_id: "6",
    offer_id: "1",
    name: "Ninja Boost PRO",
    price: 99,
    description: "Professional AI Search Optimization",
    billing_models: [
      { id: "3", name: "Monthly Subscription", type: "recurring", rebill_amount: 99 },
      { id: "2", name: "One-Time Payment", type: "one_time" }
    ]
  },
  {
    id: "2",
    product_id: "11",
    offer_id: "1",
    name: "Advanced Presence",
    price: 39,
    description: "Show up on 125+ platforms",
    billing_models: [
      { id: "3", name: "Monthly Subscription", type: "recurring", rebill_amount: 39 },
      { id: "2", name: "One-Time Payment", type: "one_time" }
    ]
  },
  {
    id: "3",
    product_id: "12",
    offer_id: "1",
    name: "Google AI-Posting Pro",
    price: 79,
    description: "Weekly AI-generated Google posts",
    billing_models: [
      { id: "3", name: "Monthly Subscription", type: "recurring", rebill_amount: 79 },
      { id: "2", name: "One-Time Payment", type: "one_time" }
    ]
  },
  {
    id: "4",
    product_id: "10",
    offer_id: "1",
    name: "Power Reviews",
    price: 29,
    description: "Automated 5-star review generation",
    billing_models: [
      { id: "3", name: "Monthly Subscription", type: "recurring", rebill_amount: 29 },
      { id: "2", name: "One-Time Payment", type: "one_time" }
    ]
  },
  {
    id: "5",
    product_id: "13",
    offer_id: "1",
    name: "ChatGPT AI Booster",
    price: 49,
    description: "Dominate AI search results",
    billing_models: [
      { id: "3", name: "Monthly Subscription", type: "recurring", rebill_amount: 49 },
      { id: "2", name: "One-Time Payment", type: "one_time" }
    ]
  },
  {
    id: "6",
    product_id: "14",
    offer_id: "1",
    name: "Essential Set Up - Ninja Boost",
    price: 99,
    description: "One-time Essential tier setup fee",
    billing_models: [
      { id: "2", name: "One-Time Payment", type: "one_time" }
    ]
  },
  {
    id: "7",
    product_id: "15",
    offer_id: "1",
    name: "PRO Set Up - Ninja Boost",
    price: 149,
    description: "One-time PRO tier setup fee",
    billing_models: [
      { id: "2", name: "One-Time Payment", type: "one_time" }
    ]
  },
  {
    id: "8",
    product_id: "16",
    offer_id: "1",
    name: "ELITE Set Up - Ninja Boost",
    price: 299,
    description: "One-time ELITE tier setup fee",
    billing_models: [
      { id: "2", name: "One-Time Payment", type: "one_time" }
    ]
  }
];

interface SelectedProduct {
  product: Product;
  billing_model_id: string;
  quantity: number;
}

const CardOnFile = () => {
  const [orderId, setOrderId] = useState("");
  const [orderFound, setOrderFound] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderLookupResponse | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [newUpsell, setNewUpsell] = useState(false);
  const [orderForceBill, setOrderForceBill] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOrderLookup = async () => {
    if (!orderId.trim()) {
      toast({
        title: "Order ID Required",
        description: "Please enter a valid order ID",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await stickyIOService.lookupOrder(orderId);

      if (result.success) {
        setOrderFound(true);
        setOrderDetails(result);
        toast({
          title: "Order Found!",
          description: `Order ${orderId} loaded successfully`
        });
      } else {
        toast({
          title: "Order Not Found",
          description: "Please check the order ID and try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error looking up order:', error);
      toast({
        title: "Error",
        description: "Failed to lookup order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = (productId: string) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (product && product.billing_models.length > 0) {
      setSelectedProducts([...selectedProducts, {
        product,
        billing_model_id: product.billing_models[0].id,
        quantity: 1
      }]);
    }
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateBillingModel = (index: number, billing_model_id: string) => {
    const updated = [...selectedProducts];
    updated[index].billing_model_id = billing_model_id;
    setSelectedProducts(updated);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, item) => {
      const billingModel = item.product.billing_models.find(bm => bm.id === item.billing_model_id);
      return sum + (billingModel?.rebill_amount || item.product.price) * item.quantity;
    }, 0);
  };

  const resetForm = () => {
    setOrderId("");
    setOrderFound(false);
    setOrderDetails(null);
    setSelectedProducts([]);
    setNewUpsell(false);
    setOrderForceBill(false);
  };

  const handleSubmitOrder = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please add at least one product to the order",
        variant: "destructive"
      });
      return;
    }

    if (!orderDetails?.customer_id) {
      toast({
        title: "Missing Customer ID",
        description: "Order details must include customer_id",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare the API request for Sticky.io Card on File (using NewOrder with existing customer)
      const apiRequest = {
        order_id: orderId,
        customer_id: orderDetails.customer_id,
        orderDetails: orderDetails, // Pass full order details for customer info
        products: selectedProducts.map((item, index) => ({
          product_id: item.product.product_id,
          offer_id: item.product.offer_id,
          billing_model_id: item.billing_model_id,
          quantity: item.quantity.toString(),
          step_num: (index + 2).toString() // Start from 2 since main product is 1
        })),
        new_upsell: newUpsell,
        order_force_bill: orderForceBill
      };

      console.log('API Request Payload:', apiRequest);

      const result = await stickyIOService.submitCardOnFile(apiRequest);

      if (result.success) {
        toast({
          title: "Order Updated Successfully!",
          description: `Added ${selectedProducts.length} product(s) to order ${orderId}. New total: $${calculateTotal()}/month`
        });

        // Reset form
        setSelectedProducts([]);
        setNewUpsell(false);
        setOrderForceBill(false);
      } else {
        toast({
          title: "Update Failed",
          description: result.message || "Failed to update order. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Error",
        description: "Failed to submit order update. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-poppins">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NinjaLogo size="md" />
              <span className="text-xl font-bold">Ninja Admin - Card on File</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheckIcon className="w-4 h-4 text-ninja-blue" />
              <span className="hidden sm:inline">Internal Tool</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Card on File - Order Update</h1>
          <p className="text-muted-foreground">
            Internal payment terminal to add products to existing Sticky orders
          </p>
        </div>

        {/* Order Lookup Section */}
        <Card className="p-6 mb-6 shadow-elegant">
          <div className="flex items-center gap-2 mb-4">
            <SearchIcon className="w-5 h-5 text-ninja-blue" />
            <h2 className="text-xl font-bold">Step 1: Find Order</h2>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="orderId" className="font-medium mb-2">Order ID</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter Sticky.io Order ID"
                className="h-12 rounded-xl border-2 focus:border-ninja-blue"
                disabled={orderFound}
              />
            </div>
            <div className="flex items-end gap-3">
              <Button
                onClick={handleOrderLookup}
                disabled={isLoading || orderFound}
                variant="ninja"
                className="h-12 px-8"
              >
                {isLoading ? "Searching..." : "Lookup Order"}
              </Button>
              {orderFound && (
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="h-12 px-8 border-2"
                >
                  Search New Order
                </Button>
              )}
            </div>
          </div>

          {orderFound && orderDetails && (
            <div className="mt-4 p-4 bg-ninja-blue/10 rounded-lg border border-ninja-blue/20">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-bold">Customer:</span> {orderDetails.customer_name}
                </div>
                <div>
                  <span className="font-bold">Email:</span> {orderDetails.email}
                </div>
                <div className="col-span-2">
                  <span className="font-bold">Current Products:</span> {orderDetails.current_products.join(", ")}
                </div>
                <div>
                  <span className="font-bold">Current Monthly Total:</span> ${orderDetails.total_monthly}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Product Selection Section */}
        {orderFound && (
          <>
            <Card className="p-6 mb-6 shadow-elegant">
              <div className="flex items-center gap-2 mb-4">
                <PackageIcon className="w-5 h-5 text-ninja-blue" />
                <h2 className="text-xl font-bold">Step 2: Select Products to Add</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {PRODUCTS.map((product) => (
                  <Card key={product.id} className="p-4 border-2 hover:border-ninja-blue/50 transition-all">
                    <h3 className="font-bold mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                    <p className="text-2xl font-bold text-ninja-blue mb-3">${product.price}</p>
                    <Button
                      onClick={() => addProduct(product.id)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Add to Order
                    </Button>
                  </Card>
                ))}
              </div>

              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-bold mb-3">Selected Products:</h3>
                  <div className="space-y-3">
                    {selectedProducts.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                        <div className="flex-1">
                          <p className="font-bold">{item.product.name}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Select
                              value={item.billing_model_id}
                              onValueChange={(value) => updateBillingModel(index, value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select billing" />
                              </SelectTrigger>
                              <SelectContent>
                                {item.product.billing_models.map((bm) => (
                                  <SelectItem key={bm.id} value={bm.id}>
                                    {bm.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            ${item.product.billing_models.find(bm => bm.id === item.billing_model_id)?.rebill_amount || item.product.price}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.product.billing_models.find(bm => bm.id === item.billing_model_id)?.type === 'recurring' ? '/month' : 'one-time'}
                          </p>
                        </div>
                        <Button
                          onClick={() => removeProduct(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Advanced Options */}
            <Card className="p-6 mb-6 shadow-elegant">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircleIcon className="w-5 h-5 text-ninja-blue" />
                <h2 className="text-xl font-bold">Step 3: Advanced Options</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="new_upsell"
                    checked={newUpsell}
                    onCheckedChange={(checked) => setNewUpsell(checked as boolean)}
                  />
                  <div>
                    <Label htmlFor="new_upsell" className="font-medium cursor-pointer">
                      Enable new_upsell
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Mark these products as new upsells for tracking and reporting
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="order_force_bill"
                    checked={orderForceBill}
                    onCheckedChange={(checked) => setOrderForceBill(checked as boolean)}
                  />
                  <div>
                    <Label htmlFor="order_force_bill" className="font-medium cursor-pointer">
                      Enable order_force_bill
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Force immediate billing for these products instead of waiting for next cycle
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Order Summary & Submit */}
            <Card className="p-6 shadow-elegant">
              <div className="flex items-center gap-2 mb-4">
                <CreditCardIcon className="w-5 h-5 text-ninja-blue" />
                <h2 className="text-xl font-bold">Step 4: Review & Submit</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold">Products to Add:</span>
                  <span className="font-bold">{selectedProducts.length}</span>
                </div>

                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold">Additional Monthly Charges:</span>
                  <span className="font-bold text-ninja-blue text-2xl">${calculateTotal()}</span>
                </div>

                <div className="flex justify-between items-center text-lg border-t pt-4">
                  <span className="font-bold">New Monthly Total:</span>
                  <span className="font-bold text-ninja-blue text-3xl">
                    ${(orderDetails?.total_monthly || 0) + calculateTotal()}
                  </span>
                </div>

                <div className="bg-ninja-yellow/10 border border-ninja-yellow/30 rounded-lg p-4 text-sm">
                  <p className="font-bold mb-2">Options Enabled:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>new_upsell: {newUpsell ? "Yes" : "No"}</li>
                    <li>order_force_bill: {orderForceBill ? "Yes" : "No"}</li>
                  </ul>
                </div>

                <Button
                  onClick={handleSubmitOrder}
                  disabled={isLoading || selectedProducts.length === 0}
                  variant="ninja"
                  size="xl"
                  className="w-full font-bold text-lg"
                >
                  {isLoading ? "Processing..." : `Update Order ${orderId}`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  This will update the subscription using Sticky.io's Card on File API
                </p>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default CardOnFile;