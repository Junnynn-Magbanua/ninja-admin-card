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
          quantity: parseInt(p.quantity) || 1
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
export type { OrderLookupResponse, CardOnFileRequest, CardOnFileResponse, Product };