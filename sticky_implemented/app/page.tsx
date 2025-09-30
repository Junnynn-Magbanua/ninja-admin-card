"use client"

import { useState, useEffect } from "react"

// Apple Pay types: access via cast to avoid global conflicts
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { User, Mail, CreditCard, Calendar, Shield, Loader2, CheckCircle } from "lucide-react"
import { createStickyOrder, validateCardDetails, formatCardNumber, type StickyOrderData } from "@/lib/sticky"

// Minimal TS shim: some DOM libs miss this method on ApplePaySession
declare global {
  interface ApplePaySession {
    abort(): void
  }
}

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderResult, setOrderResult] = useState<{success: boolean, orderId?: string, error?: string, isSimulated?: boolean} | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Prepare order data for Sticky.io
    let orderData: StickyOrderData | null = null

    try {
      // Basic validation
      if (!formData.firstName || !formData.lastName || 
          !formData.cardNumber || !formData.expiryDate || !formData.cvv) {
        alert('Please fill in all required fields')
        setIsProcessing(false)
        return
      }

      // Parse expiry date (MM/YY format)
      const [expMonth, expYear] = formData.expiryDate.split('/').map(s => s.trim())
      
      // Validate card details
      const validation = validateCardDetails(
        formData.cardNumber, 
        expMonth, 
        expYear, 
        formData.cvv
      )
      
      if (!validation.isValid) {
        alert('Invalid card details: ' + validation.errors.join(', '))
        setIsProcessing(false)
        return
      }

      // Set order data
      orderData = {
        products: [{
          id: '1', // Main product ID
          price: 69,
          name: 'A.I Powered Google Optimization'
        }],
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: '555-0123', // Default phone number
        billingAddress: '123 Main St',
        billingCity: 'Any City',
        billingState: 'CA',
        billingZip: '12345',
        billingCountry: 'US',
        cardNumber: formatCardNumber(formData.cardNumber),
        cardExpMonth: expMonth,
        cardExpYear: expYear,
        cardCvv: formData.cvv,
        totalAmount: 69
      }

      // Process payment with Sticky.io
      const result = await createStickyOrder(orderData)
      
      if (result.success) {
        setOrderResult({
          success: true,
          orderId: result.orderId,
          isSimulated: result.isSimulated
        })
      } else {
        setOrderResult({
          success: false,
          error: result.error || 'Payment failed'
        })
      }
    } catch (error) {
      console.error('Payment error:', error)
      console.log('Order data sent:', orderData)
      setOrderResult({
        success: false,
        error: 'An unexpected error occurred'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Apple Pay initialization
  useEffect(() => {
    const initializeApplePay = () => {
      console.log('🍎 Initializing Apple Pay...')
      const applePayButton = document.getElementById('apple-pay-button')
      const applePayDivider = document.getElementById('apple-pay-divider')
      
      console.log('🔍 Button element found:', !!applePayButton)
      console.log('🔍 Window object exists:', typeof window !== 'undefined')
      console.log('🔍 ApplePaySession exists:', !!window.ApplePaySession)
      
      // Check if Apple Pay is available (only on Safari)
      if (typeof window !== 'undefined' && window.ApplePaySession) {
        console.log('✅ ApplePaySession found')
        
        if (typeof window.ApplePaySession.canMakePayments === 'function') {
          console.log('✅ canMakePayments function exists')
          
          try {
            const canPay = window.ApplePaySession.canMakePayments()
            console.log('🔍 canMakePayments result:', canPay)
            
            if (canPay) {
              console.log('🎉 Apple Pay is available! Showing button...')
              
              // Show Apple Pay button and divider (removed card requirement for testing)
              if (applePayButton) {
                applePayButton.style.display = 'block'
                if (applePayDivider) applePayDivider.style.display = 'flex'
                
                // Style Apple Pay button
                applePayButton.style.webkitAppearance = '-apple-pay-button'
                ;(applePayButton.style as any).applePayButtonStyle = 'black'
                ;(applePayButton.style as any).applePayButtonType = 'buy'
                applePayButton.style.cursor = 'pointer'
              
                // Add click handler
                applePayButton.onclick = () => {
                  const request = {
                    countryCode: 'US',
                    currencyCode: 'USD',
                    supportedNetworks: ['visa', 'mastercard', 'amex', 'discover'],
                    merchantCapabilities: ['supports3DS'],
                    total: {
                      label: 'A.I Powered Google Optimization',
                      amount: '69.00'
                    }
                  }
                  
                  const session = new window.ApplePaySession(3, request)
                  
                  session.onvalidatemerchant = (_event: any) => {
                    console.log('Validating merchant...')
                    // Since we don't have proper Apple Pay merchant setup,
                    // abort immediately to prevent getting stuck in processing
                    ;(session as any).abort()
                    alert('Apple Pay is not currently available. Please use card payment instead.')
                  }
                  
                  session.onpaymentauthorized = (event: any) => {
                    console.log('Payment authorized:', event.payment)
                    session.completePayment(window.ApplePaySession.STATUS_SUCCESS)
                    // Only redirect to add-ons page for real Apple Pay transactions
                    // Since this is a mock implementation, show success message instead
                    setOrderResult({
                      success: true,
                      orderId: `APPLE-${Date.now()}`,
                      isSimulated: true
                    })
                  }
                  
                  session.begin()
                }
              }
            } else {
              console.log('❌ Apple Pay canMakePayments returned false')
            }
          } catch (error) {
            console.log('❌ Error calling canMakePayments:', error)
          }
        } else {
          console.log('❌ canMakePayments function not found')
        }
      } else {
        console.log('❌ ApplePaySession not available')
        // Hide Apple Pay button if not supported
        const applePayButton = document.getElementById('apple-pay-button')
        if (applePayButton) {
          applePayButton.style.display = 'none'
        }
      }
    }

    // Initialize Apple Pay after component mounts
    initializeApplePay()
  }, [])

  // Success state - handle real vs simulated payments
  if (orderResult?.success) {
    if (orderResult.isSimulated) {
      // Show success message for simulated/test payments
      return (
        <div className="min-h-screen bg-white py-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Payment Successful</h1>
              <p className="text-gray-600 mb-4">
                Your test order has been processed successfully.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Order ID: {orderResult.orderId}
              </p>
              <p className="text-yellow-600 font-medium mb-6">
                Note: This was a test transaction. No actual payment was charged.
              </p>
              <Button
                onClick={() => setOrderResult(null)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Place Another Order
              </Button>
            </div>
          </div>
        </div>
      )
    } else {
      // Real payment success - redirect to add-ons page
      window.location.href = 'https://addons.tryninja.co/'
      return null
    }
  }

  // Error state
  if (orderResult?.success === false) {
    return (
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">✗</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
            <p className="text-gray-600 mb-4">
              {orderResult.error || 'There was an error processing your payment.'}
            </p>
            <Button 
              onClick={() => setOrderResult(null)} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main checkout form
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image 
              src="/Ninja.png" 
              alt="Ninja Logo" 
              width={64}
              height={64}
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">A.I. Powered Google Optimization</h1>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed font-medium max-w-3xl mx-auto">
            Make your profile shine at the top of Google & Google Maps using our proprietary A.I. optimization
            technology that works faster and more effective than anything on the market.
          </p>

          {/* Benefits List */}
          <div className="text-left max-w-lg mx-auto space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700 font-medium">Get found at the top of Google & Google Maps today!</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700 font-medium">Choose the keywords to show up for!</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700 font-medium">Get more calls, customers, and leads from Google!</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">First Name</label>
                <Input 
                  placeholder="First Name" 
                  className="h-12 border-gray-300 rounded-lg text-base font-medium"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Last Name</label>
                <Input 
                  placeholder="Last Name" 
                  className="h-12 border-gray-300 rounded-lg text-base font-medium"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <Input 
                type="email"
                placeholder="your@email.com" 
                className="h-12 border-gray-300 rounded-lg text-base font-medium"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            {/* Payment Method Icons */}
            <div className="border border-gray-200 rounded-lg p-4 flex justify-center items-center gap-4 bg-gray-50">
              <div className="flex items-center gap-1">
                <img src="/cc-icons-ae.svg" alt="American Express" className="h-5" />
                <img src="/cc-icons-mc.svg" alt="Mastercard" className="h-5" />
                <img src="/cc-icons-dc.svg" alt="Discover" className="h-5" />
                <img src="/cc-icons-vs.svg" alt="Visa" className="h-5" />
              </div>
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Card Number</label>
              <Input 
                placeholder="1234 5678 9012 3456" 
                className="h-12 border-gray-300 rounded-lg text-base font-medium"
                value={formData.cardNumber}
                onChange={(e) => {
                  // Format card number with spaces
                  let value = e.target.value.replace(/\D/g, '');
                  value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                  handleInputChange('cardNumber', value);
                }}
                maxLength={19}
                required
              />
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Expiry Date</label>
                <Input 
                  placeholder="MM/YY" 
                  className="h-12 border-gray-300 rounded-lg text-base font-medium"
                  value={formData.expiryDate}
                  onChange={(e) => {
                    // Format expiry date as MM/YY
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    handleInputChange('expiryDate', value);
                  }}
                  maxLength={5}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">CVV</label>
                <Input 
                  placeholder="123" 
                  className="h-12 border-gray-300 rounded-lg text-base font-medium"
                  value={formData.cvv}
                  onChange={(e) => {
                    // Only allow numbers for CVV
                    const value = e.target.value.replace(/\D/g, '');
                    handleInputChange('cvv', value);
                  }}
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-gray-100 rounded-md p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">A.I Powered Google Optimization ($69/mo.)</span>
                <span className="text-gray-900">$69.00</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">Future Payments: $69.00 for each month</span>
              </div>
              <hr className="border-gray-300" />
              <div className="flex justify-between items-center font-semibold">
                <span className="text-gray-900">Total</span>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">USD</span>
                  <span className="text-gray-900">$69.00</span>
                </div>
              </div>
            </div>

            {/* Apple Pay Button - HIDDEN until working */}
            {/* <div id="apple-pay-button" className="w-full h-14 mb-4" style={{display: 'none'}}></div> */}

            {/* Or Divider - HIDDEN until Apple Pay working */}
            {/* <div id="apple-pay-divider" className="flex items-center my-4" style={{display: 'none'}}>
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">or pay with card</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div> */}

            {/* Sign Up Button */}
            <Button 
              type="submit"
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                'Complete Order'
              )}
            </Button>

            {/* Security Badges */}
            <div className="flex justify-center items-center gap-4 pt-4">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>SSL Secure</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>256-bit Encryption</span>
              </div>
            </div>

          </form>
      </div>
    </div>
  )
}