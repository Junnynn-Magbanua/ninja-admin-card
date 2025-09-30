# GTM Reddit Pixel Setup Instructions

This project has been configured to track Reddit Pixel events through Google Tag Manager (GTM) for the Sticky.io checkout process.

## Current Implementation

### 1. GTM Container
- **Container ID**: `GTM-P6ZXD83L`
- GTM code is installed in `app/layout.tsx`

### 2. Events Being Tracked

The following custom events are pushed to the dataLayer for Reddit tracking:

#### Page Views
- **Event**: `reddit_page_view`
- **Trigger**: On every page load and route change
- **Location**: `components/gtm-page-tracker.tsx`

#### Sticky Checkout Events
- **Event**: `sticky_checkout_start`
  - Triggered when checkout process begins
  - Data: products, total_amount, currency

- **Event**: `sticky_checkout_complete`
  - Triggered when order is successfully created
  - Data: order_id, customer_id, products, total_amount, currency
  - Also triggers `reddit_purchase` event

- **Event**: `sticky_checkout_error`
  - Triggered when checkout fails
  - Data: error_message, products, total_amount, currency

#### Reddit Pixel Events
- **Event**: `reddit_purchase`
  - Triggered on successful checkout
  - Data: purchase_value, currency, transaction_id

- **Event**: `reddit_add_to_cart`
  - Data: value, currency

- **Event**: `reddit_view_content`
  - Data: content_type, content_id

- **Event**: `reddit_sign_up`
  - For Heyflow registrations

- **Event**: `reddit_lead`
  - For lead generation

## GTM Configuration Required

To complete the setup, configure the following in GTM:

### 1. Reddit Pixel Tag Setup

1. **Create Reddit Pixel Tag**:
   - Tag Type: Custom HTML
   - HTML: Insert Reddit Pixel base code
   - Trigger: All Pages

2. **Create Reddit Purchase Event Tag**:
   - Tag Type: Custom HTML
   - HTML: Reddit Pixel purchase tracking code
   - Trigger: Custom Event `reddit_purchase`
   - Variables: Use dataLayer variables for purchase_value, currency, transaction_id

3. **Create Reddit Page View Tag**:
   - Tag Type: Custom HTML
   - HTML: Reddit Pixel page view code
   - Trigger: Custom Event `reddit_page_view`

### 2. Variables to Create

Create the following dataLayer variables in GTM:

- `dlv - purchase_value`
- `dlv - currency`
- `dlv - transaction_id`
- `dlv - order_id`
- `dlv - customer_id`
- `dlv - total_amount`
- `dlv - products`
- `dlv - error_message`

### 3. Triggers to Create

- **Reddit Page View Trigger**:
  - Type: Custom Event
  - Event Name: `reddit_page_view`

- **Reddit Purchase Trigger**:
  - Type: Custom Event
  - Event Name: `reddit_purchase`

- **Sticky Checkout Start Trigger**:
  - Type: Custom Event
  - Event Name: `sticky_checkout_start`

- **Sticky Checkout Complete Trigger**:
  - Type: Custom Event
  - Event Name: `sticky_checkout_complete`

- **Sticky Checkout Error Trigger**:
  - Type: Custom Event
  - Event Name: `sticky_checkout_error`

### 4. Reddit Pixel Configuration

You'll need to:
1. Get your Reddit Pixel ID from Reddit Ads Manager
2. Set up the Reddit Pixel base code in GTM
3. Configure conversion events (Purchase, AddToCart, etc.)

## Testing

### Debug Mode
The GTM tracking utility logs all events to console in development mode.

### GTM Preview Mode
Use GTM Preview mode to verify events are being triggered correctly.

### Events to Test
1. Page views on different routes
2. Checkout start (when user begins checkout)
3. Successful checkout completion
4. Checkout errors
5. Heyflow form submissions (if implemented)

## Files Modified/Created

### Core Implementation
- `app/layout.tsx` - GTM container installation
- `lib/gtm-tracking.ts` - GTM event tracking utility
- `components/gtm-page-tracker.tsx` - Page view tracking component

### Sticky.io Integration
- `lib/sticky.ts` - Added Reddit tracking to checkout process

### Optional Components (for direct React implementation)
- `lib/reddit-tracking.ts` - Direct Reddit Pixel wrapper (not used with GTM)
- `components/reddit-tracker.tsx` - Direct React component (not used with GTM)

## Next Steps

1. Configure Reddit Pixel in GTM using the events listed above
2. Set up conversion tracking for Reddit campaigns
3. Test all tracking events in GTM Preview mode
4. Configure Heyflow registration tracking (separate implementation needed)
5. Set up similar tracking for Meta and Google Ads platforms