# Sticky.io API Implementation Notes

Based on the working implementation from `sticky_implemented` folder.

## Key Findings

### 1. API Endpoint
- **Base URL**: `https://boostninja.sticky.io/api/v1` (NOT `api.sticky.io`)
- This is campaign-specific URL for BoostNinja

### 2. Card on File Method
The working implementation uses **`NewOrder` method** with existing customer, NOT `NewOrderCardOnFile`:

```javascript
{
  method: 'NewOrder',
  campaignId: '1',
  shippingId: '2', // Digital product
  offers: [
    {
      offer_id: parseInt(offerId),
      product_id: parseInt(productId),
      billing_model_id: parseInt(billingModelId),
      quantity: 1
    }
  ],
  // Key fields for Card on File
  customerId: 'EXISTING_CUSTOMER_ID',
  forceCustomerId: '1',
  isUpsell: '1',
  parentOrderId: 'PARENT_ORDER_ID',
  paymentType: 'CREDITCARD',
  tranType: 'Sale',
  testMode: '1' // Set to '0' for production
}
```

### 3. Order Lookup
Use `order_find` endpoint to get existing order details:
- Returns `customer_id` - REQUIRED for Card on File
- Returns `order_id` - Use as `parentOrderId`
- Returns current products and order total

### 4. Important Parameters

#### Required for Card on File:
- `customerId` - From the parent order
- `forceCustomerId: '1'` - Force use of existing customer
- `isUpsell: '1'` - Mark as upsell/add-on
- `parentOrderId` - The original order ID

#### Optional Features (from Jager's requirements):
- `new_upsell: '1'` - Mark as new upsell for tracking
- `order_force_bill: '1'` - Force immediate billing instead of waiting for next cycle

### 5. Product/Offer Structure

Each product needs:
- `offer_id` - The offer ID in Sticky.io
- `product_id` - Usually same as offer_id
- `billing_model_id` - Monthly (recurring) or One-time
- `quantity` - Default to 1

Example from working implementation:
```javascript
if (product.id === '4') {
  // Advanced Setup Fee - One time
  offerId = '1';
  billingModelId = '2';
} else {
  // Ninja Boost - Main product (recurring)
  offerId = '1';
  billingModelId = '3';
}
```

### 6. Response Validation

A successful order has:
```javascript
(result.order_id || result.orderId) &&
data.error_found !== '1' &&
!data.error_message &&
data.response_code !== 'D' // 'D' = Declined
```

### 7. Authentication
- Uses Basic Auth with username/password
- Format: `Authorization: Basic base64(username:password)`

### 8. Test Mode
- Set `testMode: '1'` for testing
- Set `testMode: '0'` for production transactions

## Current Products (Update with actual Sticky.io IDs)

From CardOnFile.tsx:
```javascript
{
  id: "1", offer_id: "1", name: "Ninja Boost PRO", price: 99
  id: "2", offer_id: "2", name: "Advanced Presence", price: 39
  id: "3", offer_id: "3", name: "Google AI-Posting Pro", price: 79
  id: "4", offer_id: "4", name: "Power Reviews", price: 29
  id: "5", offer_id: "5", name: "ChatGPT AI Booster", price: 49
}
```

**TODO**: Update these with actual offer_id and billing_model_id from Sticky.io dashboard.

## Flow Summary

1. User enters Order ID
2. Call `/order_find` to get order details + customer_id
3. Display order info and product selection
4. User selects products + billing models
5. User enables optional features (new_upsell, order_force_bill)
6. Submit via `NewOrder` method with:
   - Existing customerId
   - parentOrderId (original order)
   - New products as offers array
   - isUpsell: '1'
7. Sticky.io adds products to existing subscription
8. Show success confirmation

## Environment Variables

```env
VITE_STICKY_API_URL=https://boostninja.sticky.io/api/v1
VITE_STICKY_API_USERNAME=your_username
VITE_STICKY_API_PASSWORD=your_password
VITE_PROXY_URL=http://localhost:3001
PORT=3001
```