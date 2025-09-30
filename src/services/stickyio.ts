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
  offer_id: string;
  billing_model_id: string;
  quantity: string;
  step_num: string;
}

interface CardOnFileRequest {
  order_id: string;
  customer_id: string;
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
  private proxyUrl: string;

  constructor() {
    this.config = {
      apiUrl: import.meta.env.VITE_STICKY_API_URL || 'https://api.sticky.io',
      apiUsername: import.meta.env.VITE_STICKY_API_USERNAME || '',
      apiPassword: import.meta.env.VITE_STICKY_API_PASSWORD || ''
    };
    // Use proxy server to avoid CORS issues
    this.proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';
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
      const response = await fetch(`${this.proxyUrl}/api/order/lookup`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          order_id: orderId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
      console.log('Submitting Card on File request:', request);

      const response = await fetch(`${this.proxyUrl}/api/order/card-on-file`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
      const response = await fetch(`${this.proxyUrl}/api/products`, {
        method: 'GET',
        headers: this.getAuthHeaders()
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