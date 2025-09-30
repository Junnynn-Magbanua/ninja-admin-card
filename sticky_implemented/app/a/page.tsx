"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircleIcon, ClockIcon, ShieldCheckIcon, StarIcon, CheckIcon, TrendingUpIcon, Loader2 } from "lucide-react"
import { createStickyOrder, validateCardDetails, formatCardNumber, type StickyOrderData } from "@/lib/sticky"

// Pricing plans from zen project
const PRICING_PLANS = [
  {
    name: "Ninja Boost STARTER",
    price: 69,
    productId: "9",
    billingModelId: "3",
    offerId: "3",
    campaignId: "1",
    description: "Perfect for small businesses getting started",
    features: ["AI-Powered Google Optimization", "Voice Search Optimization", "Basic AI Search Coverage", "Monthly Performance Reports", "Email Support", "5 Keywords Tracked"]
  },
  {
    name: "Ninja Boost PRO",
    price: 99,
    productId: "6",
    billingModelId: "3",
    offerId: "3",
    campaignId: "1",
    popular: true,
    badge: "BEST VALUE",
    description: "Ideal for growing businesses seeking maximum visibility",
    features: ["Everything in Starter", "Advanced AI Search Optimization", "Mobile Search Priority", "Instant Traffic Boost", "Weekly Performance Reports", "Priority Support", "15 Keywords Tracked", "Custom Business Optimization"]
  }
]

// Simplified PricingCard component
const PricingCard = ({ plan, selected, onSelect }: { plan: any, selected: boolean, onSelect: () => void }) => {
  const isPopular = plan.popular

  return (
    <Card
      className={`relative p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
        isPopular ? 'ring-4 ring-blue-600 bg-white shadow-lg scale-[1.02]' : 'border border-gray-200'
      } ${
        selected
          ? 'ring-2 ring-blue-600 shadow-lg scale-[1.02] bg-blue-50'
          : 'hover:scale-[1.01]'
      }`}
      onClick={onSelect}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
            <TrendingUpIcon className="w-4 h-4" />
            RECOMMENDED
          </div>
        </div>
      )}

      <div className="text-center pt-3">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{plan.name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-extrabold text-blue-600">${plan.price}</span>
          <span className="text-gray-600 text-base">/mo</span>
        </div>

        <div className="space-y-2 mb-6">
          {plan.features.slice(0, 3).map((feature: string, index: number) => (
            <div key={index} className="flex items-center justify-center gap-2 text-sm">
              <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-gray-900 font-medium">{feature}</span>
            </div>
          ))}
          {plan.features.length > 3 && (
            <div className="text-xs text-gray-500 mt-2">
              +{plan.features.length - 3} more features
            </div>
          )}
        </div>

        <Button
          variant={selected ? "default" : "outline"}
          size="lg"
          className={`w-full font-bold ${isPopular ? 'ring-2 ring-blue-600/30' : ''} ${selected ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          {selected ? '✓ Selected' : 'Choose Plan'}
        </Button>
      </div>
    </Card>
  )
}

export default function APage() {
  const [selectedPlan, setSelectedPlan] = useState(PRICING_PLANS[1]) // Default to Professional
  const [currentStep, setCurrentStep] = useState(1) // 1 = package selection, 2 = checkout
  const [orderResult, setOrderResult] = useState<{success: boolean, orderId?: string, error?: string, isSimulated?: boolean} | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  })

  const handlePlanSelect = (planIndex: number) => {
    setSelectedPlan(PRICING_PLANS[planIndex])
  }

  const handleContinueToCheckout = () => {
    setCurrentStep(2)
  }

  const handleBackToPlans = () => {
    setCurrentStep(1)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Basic validation
      if (!formData.firstName || !formData.lastName || !formData.email ||
          !formData.cardNumber || !formData.expiryDate || !formData.cvv) {
        alert('Please fill in all required fields')
        setIsProcessing(false)
        return
      }

      const [expMonth, expYear] = formData.expiryDate.split('/').map(s => s.trim())

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

      const orderData: StickyOrderData = {
        products: [{
          id: (selectedPlan as any).productId,
          price: selectedPlan.price,
          name: `${selectedPlan.name} Plan - AI-Powered Google Optimization`
        }],
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: '555-0123',
        billingAddress: '123 Main St',
        billingCity: 'Any City',
        billingState: 'CA',
        billingZip: '12345',
        billingCountry: 'US',
        cardNumber: formatCardNumber(formData.cardNumber),
        cardExpMonth: expMonth,
        cardExpYear: expYear,
        cardCvv: formData.cvv,
        totalAmount: selectedPlan.price
      }

      const result = await createStickyOrder(orderData)

      if (result.success) {
        setOrderResult({
          success: true,
          orderId: result.orderId,
          isSimulated: result.isSimulated
        })
        if (!result.isSimulated) {
          window.location.href = 'https://addons.tryninja.co/'
        } else {
          setCurrentStep(3)
        }
      } else {
        setOrderResult({
          success: false,
          error: result.error || 'Payment failed'
        })
        setCurrentStep(4)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setOrderResult({
        success: false,
        error: 'An unexpected error occurred'
      })
      setCurrentStep(4)
    } finally {
      setIsProcessing(false)
    }
  }

  // Success Page
  if (currentStep === 3 && orderResult?.success) {
    return (
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">
              {orderResult.isSimulated ? 'Your test order has been processed successfully.' : 'Your order has been processed successfully.'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Order ID: {orderResult.orderId}
            </p>
            {orderResult.isSimulated && (
              <p className="text-yellow-600 font-medium mb-6">
                Note: This was a test transaction. No actual payment was charged.
              </p>
            )}
            <Button
              onClick={() => {
                setOrderResult(null)
                setCurrentStep(1)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Place Another Order
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Error Page
  if (currentStep === 4 && orderResult?.success === false) {
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
              onClick={() => {
                setOrderResult(null)
                setCurrentStep(2)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Checkout Form
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex items-center justify-between">
              <button onClick={handleBackToPlans} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium">
                ← Back to Plans
              </button>
              <div className="flex items-center gap-3">
                <Image
                  src="/Ninja.png"
                  alt="Ninja Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold">Ninja</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Secure</span>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="p-6 shadow-lg border-0">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg">{selectedPlan.name} Plan</div>
                      <div className="text-sm text-gray-600">Monthly subscription</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-3xl text-blue-600">${selectedPlan.price}</div>
                      <div className="text-sm text-gray-600">/month</div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                      <span>Instant setup included</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon className="w-4 h-4 text-blue-600" />
                      <span>Results in 24-48 hours</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Checkout Form */}
            <div>
              <Card className="p-6 shadow-lg border-0">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold">Secure Checkout</h3>
                </div>

                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">First Name</label>
                      <Input
                        placeholder="First Name"
                        className="mt-1"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Last Name</label>
                      <Input
                        placeholder="Last Name"
                        className="mt-1"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="mt-1"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Card Number</label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      className="mt-1"
                      value={formData.cardNumber}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '')
                        value = value.replace(/(\d{4})(?=\d)/g, '$1 ')
                        handleInputChange('cardNumber', value)
                      }}
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Expiry Date</label>
                      <Input
                        placeholder="MM/YY"
                        className="mt-1"
                        value={formData.expiryDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '')
                          if (value.length >= 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2, 4)
                          }
                          handleInputChange('expiryDate', value)
                        }}
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">CVV</label>
                      <Input
                        placeholder="123"
                        className="mt-1"
                        value={formData.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          handleInputChange('cvv', value)
                        }}
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg mt-6"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      `Complete Order - $${selectedPlan.price}`
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Package Selection (Step 1)
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/Ninja.png"
                alt="Ninja Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold">Ninja</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Secure checkout</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full mb-6">
            <StarIcon className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm text-blue-600">Rated the #1 Google & AI Search Optimization</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Dominate Google &<br />
            <span className="text-blue-600">AI Search Results</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Get found by your customers. See results in 24-48 hours.
          </p>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold">A</div>
                <div className="w-8 h-8 rounded-full bg-yellow-100 border-2 border-white flex items-center justify-center text-xs font-bold">B</div>
                <div className="w-8 h-8 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-xs font-bold">C</div>
              </div>
              <span className="font-medium">15,000+ businesses</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-4 h-4 fill-current" />)}
              <span className="font-bold text-gray-900 ml-1">4.9/5</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Fully Secure & AI Friendly</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
          {PRICING_PLANS.map((plan, index) =>
            <PricingCard
              key={plan.name}
              plan={plan}
              selected={selectedPlan.name === plan.name}
              onSelect={() => handlePlanSelect(index)}
            />
          )}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Button
            onClick={handleContinueToCheckout}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 font-bold text-lg px-12 py-6 mb-4 hover:scale-105 transition-all"
          >
            Continue with {selectedPlan.name} →
          </Button>

          <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600">
            <span>✓ Cancel anytime</span>
            <span>✓ Instant Setup</span>
            <span>✓ Results in 24-48h</span>
          </div>

          {/* Bottom Social Proof */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-3">Trusted by over 15,000 businesses</p>
          </div>
        </div>
      </div>
    </div>
  )
}