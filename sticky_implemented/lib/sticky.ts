declare global {
  interface Window {
    dataLayer: any[];
  }
}

export interface StickyOrderData {
  products: Array<{
    id: string;
    price: number;
    name?: string;
  }>;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry?: string;
  cardNumber: string;
  cardExpMonth: string;
  cardExpYear: string;
  cardCvv: string;
  totalAmount: number;
}

export interface StickyOrderResponse {
  success: boolean;
  orderId?: string;
  customerId?: string;
  message?: string;
  orders?: Array<{
    productId: string;
    orderId?: string;
    price: number;
    success: boolean;
    error?: string;
    response?: any;
  }>;
  totalAmount?: number;
  error?: string;
  isSimulated?: boolean;
}

const STICKY_API_URL = process.env.NEXT_PUBLIC_STICKY_API_URL || 'https://boostninja.sticky.io/api/v1';
const API_USERNAME = process.env.NEXT_PUBLIC_STICKY_API_USERNAME;
const API_PASSWORD = process.env.NEXT_PUBLIC_STICKY_API_PASSWORD;

export async function createStickyOrder(orderData: StickyOrderData): Promise<StickyOrderResponse> {
  try {
    console.log('Processing checkout:', orderData);
    
    // Basic validation
    if (!orderData || !Array.isArray(orderData.products) || orderData.products.length === 0) {
      return {
        success: false,
        error: 'Invalid request: products array is required'
      };
    }
    
    // If credentials are missing, simulate success in dev mode
    if (!API_USERNAME || !API_PASSWORD) {
      console.warn('Sticky.io API credentials not configured. Returning simulated success response.');
      const mockOrderId = `TEST-${Date.now()}`;

      // Track purchase for all platforms
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'purchase',
          value: orderData.totalAmount,
          currency: 'USD',
          transaction_id: mockOrderId,
          products: orderData.products
        });
      }

      return {
        success: true,
        orderId: mockOrderId,
        customerId: `TEST-CUST-${Date.now()}`,
        message: `Simulated order for ${orderData.products.length} product(s)`,
        orders: orderData.products.map(p => ({
          productId: p.id,
          orderId: mockOrderId,
          price: p.price,
          success: true
        })),
        totalAmount: orderData.totalAmount,
        isSimulated: true
      };
    }
    
    const auth = btoa(`${API_USERNAME}:${API_PASSWORD}`);
    const orders: Array<{
      productId: string;
      orderId?: string;
      price: number;
      success: boolean;
      error?: string;
      response?: any;
    }> = [];
    let mainOrderId: string | null = null;
    let customerId: string | null = null;
    
    // Process each product as a separate order
    for (const product of orderData.products) {
      // Set offer_id for all products - required for billing models to work
      let offerId: string;
      let billingModelId: string;

      if (product.id === '4') {
        // Advanced Setup Fee - One time
        offerId = '1';
        billingModelId = '2';
      } else{
        // Ninja Boost - Main product
        offerId = '1';
        billingModelId = '3';
      }

      // Normalize state to 2-character abbreviation
      const normalizedState = normalizeState(orderData.billingState);
      console.log(`State normalization: "${orderData.billingState}" → "${normalizedState}"`);

      // Format expiration date as MMYY (4 digits) - Sticky.io requirement
      const expYear = orderData.cardExpYear.length === 4 ? orderData.cardExpYear.slice(-2) : orderData.cardExpYear;
      const expirationDate = orderData.cardExpMonth.padStart(2, '0') + expYear.padStart(2, '0');

      // Build request data as JSON object with offers array
      const requestData: any = {
        method: 'NewOrder',
        campaignId: '1',
        shippingId: '2', // Digital
        offers: [
          {
            offer_id: parseInt(offerId),
            product_id: parseInt(product.id),
            billing_model_id: parseInt(billingModelId),
            quantity: 1
          }
        ],
        email: orderData.email,
        firstName: orderData.firstName,
        lastName: orderData.lastName,
        phone: orderData.phone,
        billingFirstName: orderData.firstName,
        billingLastName: orderData.lastName,
        billingAddress1: orderData.billingAddress,
        billingCity: orderData.billingCity,
        billingState: normalizedState,
        billingZip: orderData.billingZip,
        billing_country: orderData.billingCountry || 'US',
        shippingFirstName: orderData.firstName,
        shippingLastName: orderData.lastName,
        shippingAddress1: orderData.billingAddress,
        shippingCity: orderData.billingCity,
        shippingState: normalizedState,
        shippingZip: orderData.billingZip,
        shippingCountry: orderData.billingCountry || 'US',
        creditCardNumber: orderData.cardNumber,
        expirationDate: expirationDate,
        CVV: orderData.cardCvv,
        creditCardType: detectCardType(orderData.cardNumber),
        ipAddress: '127.0.0.1',
        paymentType: 'CREDITCARD',
        tranType: 'Sale',
        testMode: '1'
      };

      // If we have a customer ID from previous order, use it
      if (customerId) {
        requestData.customerId = customerId;
        requestData.forceCustomerId = '1';
        requestData.isUpsell = '1';
        requestData.parentOrderId = mainOrderId!;
      }

      console.log(`Creating order for product ${product.id}:`);
      console.log('billingState:', requestData.billingState);
      console.log('shippingState:', requestData.shippingState);
      console.log('Full request data:', requestData);
      
      try {
        const response = await fetch(`${STICKY_API_URL}/new_order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        const responseText = await response.text();
        console.log(`Sticky.io response for product ${product.id}:`, responseText);
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          result = { raw_response: responseText };
        }
        
        // Check if successful - need to verify both order_id AND no errors
        console.log(`Order validation for product ${product.id}:`, {
          hasOrderId: !!(result.order_id || result.orderId),
          errorFound: result.error_found,
          errorMessage: result.error_message,
          responseCode: result.response_code,
          declineReason: result.decline_reason
        });

        if ((result.order_id || result.orderId) &&
            (result.error_found !== '1' && result.error_found !== 1) &&
            !result.error_message &&
            result.response_code !== 'D') { // 'D' typically indicates declined

          const orderId = result.order_id || result.orderId;

          // Store the first order as main order
          if (!mainOrderId) {
            mainOrderId = orderId;
            customerId = result.customer_id || result.customerId;
          }

          orders.push({
            productId: product.id,
            orderId: orderId,
            price: product.price,
            success: true,
            response: result
          });
        } else {
          // Handle all failure cases - declined, errors, etc.
          const errorMessage = result.error_message ||
                              result.decline_reason ||
                              result.gateway_response ||
                              (result.response_code === 'D' ? 'Transaction declined' : 'Transaction failed');

          orders.push({
            productId: product.id,
            price: product.price,
            success: false,
            error: errorMessage
          });
        }
        
      } catch (error) {
        console.error(`Failed to create order for product ${product.id}:`, error);
        orders.push({
          productId: product.id,
          price: product.price,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Check if any orders were successful
    const successfulOrders = orders.filter(o => o.success);
    
    if (successfulOrders.length > 0) {
      // Track purchase for all platforms
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'purchase',
          value: orderData.totalAmount,
          currency: 'USD',
          transaction_id: mainOrderId,
          products: orderData.products
        });
      }

      return {
        success: true,
        orderId: mainOrderId!,
        customerId: customerId!,
        message: `Created ${successfulOrders.length} orders successfully`,
        orders: orders,
        totalAmount: orderData.totalAmount
      };
    } else {
      // If all orders failed, return error
      return {
        success: false,
        message: 'Failed to create orders',
        orders: orders,
        error: orders.length > 0 ? orders[0].error : 'Unknown error'
      };
    }
    
  } catch (error) {
    console.error('Sticky.io checkout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Order processing failed'
    };
  }
}

// US State abbreviations mapping
const US_STATES: { [key: string]: string } = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC', 'washington dc': 'DC', 'washington d.c.': 'DC'
};

export function normalizeState(state: string): string {
  if (!state) return '';
  
  const cleanState = state.trim();
  
  // If already 2 characters and uppercase, return as is
  if (cleanState.length === 2 && cleanState === cleanState.toUpperCase()) {
    return cleanState;
  }
  
  // Try to find abbreviation for full state name
  const stateAbbr = US_STATES[cleanState.toLowerCase()];
  if (stateAbbr) {
    return stateAbbr;
  }
  
  // If 2 characters but lowercase, convert to uppercase
  if (cleanState.length === 2) {
    return cleanState.toUpperCase();
  }
  
  // Default fallback - return first 2 characters uppercase
  return cleanState.substring(0, 2).toUpperCase();
}

export function detectCardType(cardNumber: string): string {
  if (!cardNumber) return 'visa';
  const firstDigit = cardNumber.charAt(0);
  switch(firstDigit) {
    case '3': return 'amex';
    case '4': return 'visa';
    case '5': return 'master';
    case '6': return 'discover';
    default: return 'visa';
  }
}

export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
}

export function validateCardDetails(cardNumber: string, expMonth: string, expYear: string, cvv: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate card number (basic length check)
  const cleanCardNumber = formatCardNumber(cardNumber);
  if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
    errors.push('Invalid card number length');
  }
  
  // Validate expiration month
  const month = parseInt(expMonth);
  if (isNaN(month) || month < 1 || month > 12) {
    errors.push('Invalid expiration month');
  }
  
  // Validate expiration year (accept both YY and YYYY formats)
  let year = parseInt(expYear);
  if (expYear.length === 2) {
    // Convert YY to YYYY (assume 20XX for years 00-99)
    year = 2000 + year;
  }
  const currentYear = new Date().getFullYear();
  if (isNaN(year) || year < currentYear || year > currentYear + 20) {
    errors.push('Invalid expiration year');
  }
  
  // Validate CVV
  if (!/^\d{3,4}$/.test(cvv)) {
    errors.push('Invalid CVV');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}