import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Sticky.io API configuration
const STICKY_API_URL = process.env.VITE_STICKY_API_URL || 'https://boostninja.sticky.io/api/v1';
const STICKY_USERNAME = process.env.VITE_STICKY_API_USERNAME;
const STICKY_PASSWORD = process.env.VITE_STICKY_API_PASSWORD;

// Helper function to create Basic Auth header
function getAuthHeader() {
  const credentials = Buffer.from(`${STICKY_USERNAME}:${STICKY_PASSWORD}`).toString('base64');
  return `Basic ${credentials}`;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sticky.io proxy server is running' });
});

// Order lookup endpoint
app.post('/api/order/lookup', async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required' });
  }

  try {
    const requestData = {
      method: 'order_find',
      order_id: order_id
    };

    const response = await fetch(`${STICKY_API_URL}/order_find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();
    console.log('Sticky.io order_find response:', data);

    // Check if order exists (even if there was a payment error)
    const orderExists = !!(data.order_id || data.orderId);

    if (!orderExists) {
      return res.json({
        success: false,
        order_id: order_id,
        error: 'Order not found'
      });
    }

    // Extract customer ID - try multiple possible field names
    const customerId = data.customerId || data.customer_id || data.customer?.id || data.customer?.customer_id;

    // If no customer ID found, we might need to use order_id as fallback for card on file
    // Note: Card on File requires customer_id, if not present, user may need to provide payment info

    // Parse the response to extract order details
    const result = {
      success: true, // Order exists, even if payment failed
      order_id: data.order_id || data.orderId || order_id,
      customer_id: customerId || `ORDER-${order_id}`, // Fallback to order-based ID
      customer_name: data.customer?.first_name && data.customer?.last_name
        ? `${data.customer.first_name} ${data.customer.last_name}`
        : (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : 'Unknown'),
      email: data.customer?.email || data.email || 'Unknown',
      current_products: data.products?.map(p =>
        `${p.product_name || p.productName || 'Product'} - $${p.product_price || p.price || 0}${p.is_recurring || p.isRecurring ? '/month' : ''}`
      ) || [],
      total_monthly: parseFloat(data.orderTotalAmount || data.order_total || data.orderTotal || 0) || 0,
      payment_status: data.status || (data.error_found === '1' ? 'ERROR' : 'SUCCESS'),
      error_message: data.error_message || data.decline_reason || null,
      has_customer_id: !!customerId,
      data: data
    };

    console.log('Parsed result:', {
      order_id: result.order_id,
      customer_id: result.customer_id,
      has_customer_id: result.has_customer_id,
      email: result.email
    });

    res.json(result);
  } catch (error) {
    console.error('Error looking up order:', error);
    res.status(500).json({
      error: 'Failed to lookup order',
      message: error.message
    });
  }
});

// Card on File submission endpoint
app.post('/api/order/card-on-file', async (req, res) => {
  const { order_id, customer_id, products, new_upsell, order_force_bill } = req.body;

  if (!order_id || !products || products.length === 0) {
    return res.status(400).json({ error: 'order_id and products are required' });
  }

  try {
    // Build the API request payload using NewOrder method with existing customer
    const payload = {
      method: 'NewOrder',
      campaignId: '1',
      shippingId: '2', // Digital
      offers: products.map(p => ({
        offer_id: parseInt(p.offer_id),
        product_id: parseInt(p.offer_id), // Use offer_id as product_id for now
        billing_model_id: parseInt(p.billing_model_id),
        quantity: parseInt(p.quantity) || 1
      })),
      // Use existing customer from parent order
      customerId: customer_id,
      forceCustomerId: '1',
      isUpsell: '1',
      parentOrderId: order_id,
      paymentType: 'CREDITCARD',
      tranType: 'Sale',
      testMode: '1' // Change to '0' for production
    };

    // Add optional parameters
    if (new_upsell) {
      payload.new_upsell = '1';
    }

    if (order_force_bill) {
      payload.order_force_bill = '1';
    }

    console.log('Submitting Card on File request (NewOrder method):', JSON.stringify(payload, null, 2));

    const response = await fetch(`${STICKY_API_URL}/new_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('Sticky.io card on file response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw_response: responseText };
    }

    // Check if successful
    const isSuccess = !!(data.order_id || data.orderId) &&
                     data.error_found !== '1' &&
                     !data.error_message &&
                     data.response_code !== 'D';

    const result = {
      success: isSuccess,
      order_id: data.order_id || data.orderId || order_id,
      message: isSuccess ?
        'Order updated successfully - products added to subscription' :
        (data.error_message || data.decline_reason || 'Failed to update order'),
      data: data
    };

    res.json(result);
  } catch (error) {
    console.error('Error submitting card on file:', error);
    res.status(500).json({
      error: 'Failed to submit card on file',
      message: error.message
    });
  }
});

// Get products endpoint (if needed)
app.get('/api/products', async (req, res) => {
  try {
    const response = await fetch(`${STICKY_API_URL}/product_index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      }
    });

    const data = await response.json();
    res.json({ products: data.products || [] });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Sticky.io Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to: ${STICKY_API_URL}`);
});