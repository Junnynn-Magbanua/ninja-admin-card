# Ninja Admin - Card on File

Internal payment terminal for updating existing Sticky.io orders with add-on products.

## Project info

**URL**: https://lovable.dev/projects/8245829e-745f-4a46-9166-0bc93fe76f6f

## Features

- **Order Lookup**: Search and retrieve existing Sticky.io orders by Order ID
- **Product Selection**: Add multiple products to existing subscriptions
- **Billing Model Selection**: Choose between Monthly (recurring) or One-time charges
- **Advanced Options**:
  - `new_upsell`: Mark products as new upsells for tracking
  - `order_force_bill`: Force immediate billing instead of waiting for next cycle
- **Real-time Total Calculation**: See updated subscription totals before submitting
- **Sticky.io API Integration**: Direct integration with Sticky.io's Card on File API

## Setup Instructions

### 1. Install Dependencies

```sh
npm install
```

### 2. Configure Sticky.io API Credentials

Create a `.env` file in the project root (copy from `.env.example`):

```sh
cp .env.example .env
```

Edit the `.env` file with your Sticky.io API credentials:

```env
VITE_STICKY_API_URL=https://api.sticky.io
VITE_STICKY_API_USERNAME=your_api_username
VITE_STICKY_API_PASSWORD=your_api_password
```

**Important**: Replace `your_api_username` and `your_api_password` with your actual Sticky.io API credentials.

### 3. Install Backend Dependencies

```sh
npm install
```

### 4. Start Both Servers (Backend + Frontend)

**Option 1: Start both servers together (recommended)**
```sh
npm run dev:all
```

**Option 2: Start servers separately**
```sh
# Terminal 1 - Start backend proxy server
npm run server

# Terminal 2 - Start frontend dev server
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173` or `http://localhost:8080`
- Backend API: `http://localhost:3001`

## Usage

1. **Find Order**: Enter a Sticky.io Order ID and click "Lookup Order"
2. **Select Products**: Choose products to add from the available catalog
3. **Configure Billing**: Select Monthly or One-time billing for each product
4. **Set Options**: Enable `new_upsell` or `order_force_bill` if needed
5. **Submit**: Review the order summary and click "Update Order"

## Available Routes

- `/` - Card on File order update tool (Internal payment terminal)

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8245829e-745f-4a46-9166-0bc93fe76f6f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Sticky.io API (Card on File integration)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8245829e-745f-4a46-9166-0bc93fe76f6f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## API Documentation

This project integrates with Sticky.io's Card on File API:

- **Endpoint**: `/new_order_card_on_file`
- **Method**: POST
- **Authentication**: Basic Auth (username/password)

### Request Parameters

- `order_id`: The existing order ID to update
- `products`: Array of products to add
  - `offer_id`: Product offer ID from Sticky.io
  - `billing_model_id`: Billing model (monthly/one-time)
  - `quantity`: Product quantity
  - `step_num`: Step number in the funnel
- `new_upsell` (optional): Mark as new upsell for tracking
- `order_force_bill` (optional): Force immediate billing

For detailed API documentation, visit: https://developer-prod.sticky.io
