/**
 * Sticky.io API Service
 * Handles all interactions with the Sticky.io API
 */

interface StickyConfig {
  apiUrl: string;
  apiUsername: string;
  apiPassword: string;
}

interface OrderLookupResponse {
  success: boolean;
  order_id: string;
  customer_id?: string;
  customer_name: string;
  email: string;
  current_products: string[];
  total_monthly: number;
  data?: any;
}

interface Product {
  product_id: string;
  offer_id: string;
  billing_model_id: string;
  quantity: string;
  step_num: string;
}

interface CardOnFileRequest {
  order_id: string;
  customer_id: string;
  orderDetails?: any;
  products: Product[];
  new_upsell?: boolean;
  order_force_bill?: boolean;
}

interface CardOnFileResponse {
  success: boolean;
  order_id: string;
  message: string;
  data?: any;
}

interface PaymentMethodRequest {
  customer_id: string;
  order_id: string;
  card_number: string;
  card_month: string;
  card_year: string;
  card_cvv: string;
  billing_first_name?: string;
  billing_last_name?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  billing_country?: string;
}

interface PaymentMethodResponse {
  success: boolean;
  message: string;
  data?: any;
}

class StickyIOService {
  private config: StickyConfig;

  constructor() {
    this.config = {
      apiUrl: import.meta.env.VITE_STICKY_API_URL || 'https://boostninja.sticky.io/api/v1',
      apiUsername: import.meta.env.VITE_STICKY_API_USERNAME || '',
      apiPassword: import.meta.env.VITE_STICKY_API_PASSWORD || ''
    };
  }

  /**
   * Get authentication headers for Sticky.io API
   */
  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Lookup an existing order by ID
   * @param orderId - The Sticky.io order ID
   */
  async lookupOrder(orderId: string): Promise<OrderLookupResponse> {
    try {
      const auth = btoa(`${this.config.apiUsername}:${this.config.apiPassword}`);

      // Use order_view to get a single order by ID
      const requestData = {
        order_id: orderId
      };

      console.log('Sending order_view to Sticky.io:', requestData);

      const response = await fetch(`${this.config.apiUrl}/order_view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('Full Sticky.io response:', JSON.stringify(data, null, 2));
      console.log('Response code:', data.response_code);

      // Check if order was found (response_code 100 means success)
      if (data.response_code === '100' && data.order_id) {
        // Order data is at root level, not nested
        const customerId = data.customer_id;

        const result = {
          success: true,
          order_id: data.order_id || orderId,
          customer_id: customerId,
          customer_name: `${data.billing_first_name || ''} ${data.billing_last_name || ''}`.trim() || 'Unknown',
          email: data.email_address || 'Unknown',
          current_products: data.products?.map((p: any) =>
            `${p.name || 'Product'} - $${p.price || 0}`
          ) || [],
          total_monthly: parseFloat(data.order_total || 0) || 0,
          data: data
        };

        console.log('Returning success result:', result);
        return result;
      }

      // Order not found or error
      console.log('Order not found - response_code:', data.response_code);
      return {
        success: false,
        order_id: orderId,
        customer_name: 'Unknown',
        email: 'Unknown',
        current_products: [],
        total_monthly: 0,
        data: data
      };
    } catch (error) {
      console.error('Error looking up order:', error);
      throw error;
    }
  }

  /**
   * Submit a Card on File order to add products to an existing subscription
   * @param request - The card on file request data
   */
  async submitCardOnFile(request: CardOnFileRequest): Promise<CardOnFileResponse> {
    try {
      const auth = btoa(`${this.config.apiUsername}:${this.config.apiPassword}`);
      const order = request.orderDetails?.data || {};

      // Use the Card on File endpoint with simplified payload
      const payload: any = {
        previousOrderId: request.order_id,
        shippingId: '2',
        ipAddress: order.ip_address || '127.0.0.1',
        campaignId: '2',
        offers: request.products.map(p => ({
          offer_id: parseInt(p.offer_id),
          product_id: parseInt(p.product_id),
          billing_model_id: parseInt(p.billing_model_id),
          quantity: parseInt(p.quantity) || 1,
          step_num: p.step_num || '2'
        }))
      };

      if (request.new_upsell) payload.new_upsell = '1';
      if (request.order_force_bill) payload.order_force_bill = '1';

      console.log('Submitting Card on File request:', payload);

      const response = await fetch(`${this.config.apiUrl}/new_order_card_on_file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Card on File response:', data);

      const isSuccess = !!(data.order_id || data.orderId) &&
                       (data.error_found !== '1' && data.error_found !== 1) &&
                       !data.error_message &&
                       data.response_code !== 'D';

      return {
        success: isSuccess,
        order_id: data.order_id || data.orderId || request.order_id,
        message: isSuccess ?
          'Order updated successfully' :
          (data.error_message || data.decline_reason || 'Failed to update order'),
        data: data
      };
    } catch (error) {
      console.error('Error submitting card on file:', error);
      throw error;
    }
  }

  /**
   * Detect card type from card number
   * Matches working version's simpler implementation
   * @param cardNumber - The credit card number
   */
  private detectCardType(cardNumber: string): string {
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

  /**
   * Find orders with specific criteria (e.g., is_recurring)
   * @param customerId - The customer ID
   * @param criteria - Search criteria (e.g., 'is_recurring')
   */
  async findOrders(customerId: string, criteria: string = 'is_recurring'): Promise<any> {
    try {
      const auth = btoa(`${this.config.apiUsername}:${this.config.apiPassword}`);

      const requestData: any = {
        customer_id: customerId
      };

      if (criteria === 'is_recurring') {
        requestData.is_recurring = '1';
      }

      console.log('Finding orders with criteria:', requestData);

      const response = await fetch(`${this.config.apiUrl}/order_find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('Order find response:', data);

      return data;
    } catch (error) {
      console.error('Error finding orders:', error);
      throw error;
    }
  }

  /**
   * Update payment method for a recurring order
   * First finds the most recent recurring order, then updates it
   * @param request - Payment method details
   */
  async updatePaymentMethod(request: PaymentMethodRequest): Promise<PaymentMethodResponse> {
    try {
      const auth = btoa(`${this.config.apiUsername}:${this.config.apiPassword}`);

      console.log('=== Payment Method Update Process ===');
      console.log('Customer ID:', request.customer_id);
      console.log('Order ID:', request.order_id);

      // Step 1: Find the most recent recurring order
      console.log('\n[1/3] Finding most recent recurring order...');
      const ordersData = await this.findOrders(request.customer_id, 'is_recurring');

      // Extract the most recent order ID
      let targetOrderId = request.order_id;

      if (ordersData.order_ids && Array.isArray(ordersData.order_ids) && ordersData.order_ids.length > 0) {
        targetOrderId = ordersData.order_ids[0];
        console.log('✓ Found most recent recurring order:', targetOrderId);
      } else if (ordersData.order_id) {
        targetOrderId = ordersData.order_id;
        console.log('✓ Using single order ID from response:', targetOrderId);
      } else {
        console.log('⚠ No recurring orders found, using provided order ID:', targetOrderId);
      }

      // Step 2: Prepare payment data
      console.log('\n[2/3] Preparing payment data...');

      // Format expiration date as MMYY (4 digits) - Sticky.io requirement
      const expYear = request.card_year.length === 4 ? request.card_year.slice(-2) : request.card_year;
      const expirationDate = request.card_month.padStart(2, '0') + expYear.padStart(2, '0');

      // Detect card type
      const creditCardType = this.detectCardType(request.card_number);

      console.log('Card type:', creditCardType);
      console.log('Card ending in:', request.card_number.slice(-4));
      console.log('Expiration:', expirationDate);

      // Step 3: Prepare the order_update payload
      const payload = {
        order_id: {
          [targetOrderId]: {
            cc_payment_type: creditCardType,
            cc_number: request.card_number,
            cc_expiration_date: expirationDate
          }
        }
      };

      console.log('\n[3/3] Updating payment method...');

      const response = await fetch(`${this.config.apiUrl}/order_update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('Sticky.io response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { raw_response: responseText };
      }

      // Check for success - response_code 100 indicates success
      const isSuccess = result.response_code === '100';

      console.log('Order validation:', {
        responseCode: result.response_code,
        isSuccess: isSuccess
      });

      let message = 'Payment method updated successfully';

      if (!isSuccess) {
        // Handle specific error codes
        if (result.response_code === '911') {
          message = 'The payment information is the same as the current card on file';
        } else if (result.response_code === '343') {
          message = 'Invalid payment information provided';
        } else {
          message = `Failed to update payment method (Code: ${result.response_code})`;
        }

        // Check for field-specific errors
        if (result.order_id && result.order_id[targetOrderId]) {
          const fieldErrors = result.order_id[targetOrderId];
          const errorFields = [];

          if (fieldErrors.cc_payment_type?.response_code === '343') {
            errorFields.push('card type');
          }
          if (fieldErrors.cc_number?.response_code === '343') {
            errorFields.push('card number');
          }
          if (fieldErrors.cc_expiration_date?.response_code === '343') {
            errorFields.push('expiration date');
          }

          if (errorFields.length > 0) {
            message = `Invalid ${errorFields.join(', ')}`;
          }
        }
      }

      if (isSuccess) {
        console.log('✓ Payment method updated successfully');
      } else {
        console.log('✗ Update failed:', message);
      }

      return {
        success: isSuccess,
        message: message,
        data: result
      };
    } catch (error) {
      console.error('Payment method update error:', error);
      throw error;
    }
  }

  /**
   * Add a new payment method (currently same as update)
   * @param request - Payment method details
   */
  async addPaymentMethod(request: PaymentMethodRequest): Promise<PaymentMethodResponse> {
    // For now, adding a payment method uses the same logic as updating
    return this.updatePaymentMethod(request);
  }

  /**
   * Get all available products from Sticky.io
   * Note: This may require a different endpoint depending on your Sticky.io setup
   */
  async getProducts(): Promise<any[]> {
    try {
      const auth = btoa(`${this.config.apiUsername}:${this.config.apiPassword}`);

      const response = await fetch(`${this.config.apiUrl}/product_index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const stickyIOService = new StickyIOService();

// Export types for use in components
export type { OrderLookupResponse, CardOnFileRequest, CardOnFileResponse, Product, PaymentMethodRequest, PaymentMethodResponse };