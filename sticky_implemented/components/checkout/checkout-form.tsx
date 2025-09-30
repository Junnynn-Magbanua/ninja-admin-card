import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { LockIcon, CreditCardIcon, ShieldCheckIcon, Loader2 } from "lucide-react";
import { createStickyOrder, validateCardDetails, formatCardNumber as formatCardNum, type StickyOrderData } from "@/lib/sticky";
import { sendToGoogleSheets, getVariant, type GoogleSheetsData } from "@/lib/google-sheets";

interface CheckoutFormProps {
  selectedPlan: {
    name: string;
    price: number;
  };
  onSubmit: (result: { success: boolean; orderId?: string; error?: string; isSimulated?: boolean }) => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ selectedPlan, onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Basic validation
      if (!formData.firstName || !formData.lastName || !formData.email ||
          !formData.phone || !formData.cardNumber || !formData.expiryDate || !formData.cvv) {
        alert('Please fill in all required fields');
        setIsProcessing(false);
        return;
      }

      // Parse expiry date (MM/YY format)
      const [expMonth, expYear] = formData.expiryDate.split('/').map(s => s.trim());

      // Validate card details
      const validation = validateCardDetails(
        formData.cardNumber,
        expMonth,
        expYear,
        formData.cvv
      );

      if (!validation.isValid) {
        alert('Invalid card details: ' + validation.errors.join(', '));
        setIsProcessing(false);
        return;
      }

      // Map plan price to product ID
      let productId = '1'; // Default to main product
      if (selectedPlan.price === 99) {
        productId = '6'; // Professional plan uses main product
      } else if (selectedPlan.price === 69) {
        productId = '1'; // Starter plan also uses main product
      }

      // Prepare order data for Sticky.io
      const orderData: StickyOrderData = {
        products: [{
          id: productId,
          price: selectedPlan.price,
          name: `${selectedPlan.name} Plan - AI-Powered Google Optimization`
        }],
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        billingAddress: formData.billingAddress || '123 Main St',
        billingCity: formData.city || 'Any City',
        billingState: formData.state || 'CA',
        billingZip: formData.zipCode || '12345',
        billingCountry: 'US',
        cardNumber: formatCardNum(formData.cardNumber),
        cardExpMonth: expMonth,
        cardExpYear: expYear,
        cardCvv: formData.cvv,
        totalAmount: selectedPlan.price
      };

      // Process payment with Sticky.io
      const result = await createStickyOrder(orderData);

      // Send data to Google Sheets regardless of payment success/failure
      const sheetsData: GoogleSheetsData = {
        timestamp: new Date().toISOString(),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        selectedPlan: selectedPlan.name,
        price: selectedPlan.price,
        orderId: result.orderId || 'N/A',
        success: result.success,
        variant: getVariant()
      };

      // Attempt to send to Google Sheets (non-blocking)
      sendToGoogleSheets(sheetsData).catch(error => {
        console.error('Failed to send data to Google Sheets:', error);
      });

      if (result.success) {
        onSubmit({
          success: true,
          orderId: result.orderId,
          isSimulated: result.isSimulated
        });
      } else {
        onSubmit({
          success: false,
          error: result.error || 'Payment failed'
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      onSubmit({
        success: false,
        error: 'An unexpected error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const formatCVV = (value: string) => {
    return value.replace(/[^0-9]/gi, '').substring(0, 4);
  };

  const formatPhoneNumber = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 6) {
      return `(${v.substring(0, 3)}) ${v.substring(3, 6)}-${v.substring(6, 10)}`;
    } else if (v.length >= 3) {
      return `(${v.substring(0, 3)}) ${v.substring(3)}`;
    }
    return v;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = formatCVV(value);
    } else if (field === 'phone') {
      formattedValue = formatPhoneNumber(value);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="font-bold text-foreground">Contact Information</h4>
        <div className="space-y-3">
          <div>
            <Label htmlFor="email" className="font-medium">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@business.com"
              required
              className="h-12 rounded-xl border-2 focus:border-ninja-blue"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName" className="font-medium">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="John"
                required
                className="h-12 rounded-xl border-2 focus:border-ninja-blue"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="font-medium">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
                required
                className="h-12 rounded-xl border-2 focus:border-ninja-blue"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone" className="font-medium">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              required
              className="h-12 rounded-xl border-2 focus:border-ninja-blue"
            />
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5 text-ninja-blue" />
          <h4 className="font-bold text-foreground">Payment Details</h4>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="cardNumber" className="font-medium">Card Number *</Label>
            <Input
              id="cardNumber"
              type="text"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              autoComplete="cc-number"
              required
              className="h-12 rounded-xl border-2 focus:border-ninja-blue"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expiryDate" className="font-medium">Expiry *</Label>
              <Input
                id="expiryDate"
                type="text"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
                autoComplete="cc-exp"
                required
                className="h-12 rounded-xl border-2 focus:border-ninja-blue"
              />
            </div>
            <div>
              <Label htmlFor="cvv" className="font-medium">CVV *</Label>
              <Input
                id="cvv"
                type="text"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                placeholder="123"
                maxLength={4}
                autoComplete="cc-csc"
                required
                className="h-12 rounded-xl border-2 focus:border-ninja-blue"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-xl p-3">
        <ShieldCheckIcon className="w-4 h-4 text-ninja-blue" />
        <span>256-bit SSL encryption</span>
      </div>

      <Button
        type="submit"
        variant="ninja"
        size="xl"
        className="w-full font-bold text-lg"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Start $${selectedPlan.price}/month →`
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground leading-relaxed">
        By continuing, you agree to our Terms & Privacy Policy. Cancel anytime.
      </p>
    </form>
  );
};