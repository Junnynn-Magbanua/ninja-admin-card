# GTM Reddit Pixel Setup - Detailed Step-by-Step Guide

## Prerequisites
- Access to Google Tag Manager (GTM) container `GTM-P6ZXD83L`
- Reddit Pixel ID from Reddit Ads Manager

## Step 1: Get Your Reddit Pixel ID

1. **Login to Reddit Ads Manager**
   - Go to https://ads.reddit.com
   - Login with your Reddit account

2. **Access Events Manager**
   - Click on "Events Manager" in the left sidebar
   - OR click "Tools" → "Events Manager"

3. **Get Pixel ID**
   - If you have an existing pixel: Copy the Pixel ID (format: `t2_xxxxxxxxx`)
   - If you need to create one: Click "Create Pixel" → Name it → Copy the Pixel ID

## Step 2: Access GTM Container

1. **Login to GTM**
   - Go to https://tagmanager.google.com
   - Select container `GTM-P6ZXD83L`

## Step 3: Create Variables

### 3.1 Create Purchase Value Variable
1. **Navigate to Variables**
   - Click "Variables" in left sidebar
   - Click "New" in "User-Defined Variables" section

2. **Configure Variable**
   - Variable Name: `dlv - purchase_value`
   - Click "Variable Configuration"
   - Select "Data Layer Variable"
   - Data Layer Variable Name: `purchase_value`
   - Click "Save"

### 3.2 Create Currency Variable
1. **Click "New" again**
2. **Configure Variable**
   - Variable Name: `dlv - currency`
   - Variable Type: "Data Layer Variable"
   - Data Layer Variable Name: `currency`
   - Click "Save"

### 3.3 Create Transaction ID Variable
1. **Click "New" again**
2. **Configure Variable**
   - Variable Name: `dlv - transaction_id`
   - Variable Type: "Data Layer Variable"
   - Data Layer Variable Name: `transaction_id`
   - Click "Save"

## Step 4: Create Triggers

### 4.1 Create Reddit Page View Trigger
1. **Navigate to Triggers**
   - Click "Triggers" in left sidebar
   - Click "New"

2. **Configure Trigger**
   - Trigger Name: `Reddit Page View`
   - Click "Trigger Configuration"
   - Select "Custom Event"
   - Event name: `reddit_page_view`
   - Check "Use regex matching" if needed: **LEAVE UNCHECKED**
   - Click "Save"

### 4.2 Create Reddit Purchase Trigger
1. **Click "New" again**
2. **Configure Trigger**
   - Trigger Name: `Reddit Purchase`
   - Trigger Type: "Custom Event"
   - Event name: `reddit_purchase`
   - Click "Save"

## Step 5: Create Reddit Pixel Tags

### 5.1 Create Reddit Pixel Base Code Tag
1. **Navigate to Tags**
   - Click "Tags" in left sidebar
   - Click "New"

2. **Configure Tag**
   - Tag Name: `Reddit Pixel - Base Code`
   - Click "Tag Configuration"
   - Select "Custom HTML"

3. **Add HTML Code**
   ```html
   <script>
   !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
   rdt('init','YOUR_REDDIT_PIXEL_ID_HERE');
   </script>
   ```

4. **Replace Pixel ID**
   - Replace `YOUR_REDDIT_PIXEL_ID_HERE` with your actual Reddit Pixel ID

5. **Set Triggering**
   - Click "Triggering"
   - Select "All Pages"
   - Click "Save"

### 5.2 Create Reddit PageVisit Event Tag
1. **Click "New" again**
2. **Configure Tag**
   - Tag Name: `Reddit Pixel - PageVisit`
   - Tag Type: "Custom HTML"

3. **Add HTML Code**
   ```html
   <script>
   rdt('track', 'PageVisit');
   </script>
   ```

4. **Set Triggering**
   - Click "Triggering"
   - Select "Reddit Page View" (the trigger you created)
   - Click "Save"

### 5.3 Create Reddit Purchase Event Tag
1. **Click "New" again**
2. **Configure Tag**
   - Tag Name: `Reddit Pixel - Purchase`
   - Tag Type: "Custom HTML"

3. **Add HTML Code**
   ```html
   <script>
   rdt('track', 'Purchase', {
       value: {{dlv - purchase_value}},
       currency: {{dlv - currency}},
       transactionId: {{dlv - transaction_id}}
   });
   </script>
   ```

4. **Set Triggering**
   - Click "Triggering"
   - Select "Reddit Purchase" (the trigger you created)
   - Click "Save"

## Step 6: Test Your Setup

### 6.1 Enable Preview Mode
1. **Click "Preview" button** (top right of GTM interface)
2. **Enter your website URL**: `https://yourdomain.com`
3. **Click "Start"**

### 6.2 Test Page Views
1. **Visit your website** (new tab should open with GTM preview)
2. **Check GTM Preview panel**
   - Look for "Reddit Pixel - Base Code" tag firing on "Container Loaded"
   - Look for "Reddit Pixel - PageVisit" tag firing on "reddit_page_view" event

### 6.3 Test Purchase Events
1. **Complete a test checkout** on your website
2. **Check GTM Preview panel**
   - Look for "Reddit Pixel - Purchase" tag firing on "reddit_purchase" event
   - Verify data is populated (purchase_value, currency, transaction_id)

### 6.4 Check Browser Console
1. **Open browser developer tools** (F12)
2. **Go to Console tab**
3. **Look for GTM Event logs**:
   ```
   GTM Event pushed: {event: "reddit_page_view"}
   GTM Event pushed: {event: "reddit_purchase", purchase_value: 99.99, currency: "USD", transaction_id: "TEST-123"}
   ```

## Step 7: Verify in Reddit

### 7.1 Check Reddit Events Manager
1. **Go back to Reddit Ads Manager**
2. **Navigate to Events Manager**
3. **Select your pixel**
4. **Check "Events" tab**
   - You should see "PageVisit" events
   - You should see "Purchase" events (after completing test checkout)

### 7.2 Test Events
- **PageVisit events**: Should appear within a few minutes
- **Purchase events**: Should appear after completing checkout

## Step 8: Publish Your Changes

1. **Exit Preview Mode** (click "Leave Preview Mode")
2. **Click "Submit"** (top right)
3. **Add Version Name**: "Reddit Pixel Implementation"
4. **Add Description**: "Added Reddit pixel tracking for page views and purchases"
5. **Click "Publish"**

## Troubleshooting

### Common Issues:

1. **No events in Reddit dashboard**
   - Check if Pixel ID is correct in base code tag
   - Verify tags are firing in GTM Preview
   - Wait up to 20 minutes for events to appear

2. **Purchase events not firing**
   - Test checkout process
   - Check if `reddit_purchase` trigger is working
   - Verify purchase_value variable has data

3. **Variables showing undefined**
   - Check dataLayer variable names match exactly
   - Ensure events are being pushed to dataLayer correctly

### Debug Commands:
Open browser console and type:
```javascript
// Check if dataLayer exists
console.log(window.dataLayer);

// Check Reddit pixel
console.log(window.rdt);

// Manually trigger test event
window.dataLayer.push({
  event: 'reddit_purchase',
  purchase_value: 99.99,
  currency: 'USD',
  transaction_id: 'TEST-123'
});
```

## Summary

After completing these steps, your Reddit tracking will be live and you'll see:

✅ **PageVisit events** in Reddit dashboard for all website visitors
✅ **Purchase events** in Reddit dashboard for completed Sticky.io checkouts
✅ **Proper attribution** for Reddit ad campaigns
✅ **Conversion data** for campaign optimization

Your Reddit pixel is now properly integrated with Sticky.io through GTM!