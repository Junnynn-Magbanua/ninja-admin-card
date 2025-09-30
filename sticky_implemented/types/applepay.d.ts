declare global {
  interface Window {
    ApplePaySession: typeof ApplePaySession;
  }
}

declare class ApplePaySession {
  static readonly STATUS_SUCCESS: number;
  static readonly STATUS_FAILURE: number;
  static readonly STATUS_INVALID_BILLING_POSTAL_ADDRESS: number;
  static readonly STATUS_INVALID_SHIPPING_POSTAL_ADDRESS: number;
  static readonly STATUS_INVALID_SHIPPING_CONTACT: number;
  static readonly STATUS_PIN_REQUIRED: number;
  static readonly STATUS_PIN_INCORRECT: number;
  static readonly STATUS_PIN_LOCKOUT: number;

  static canMakePayments(): boolean;
  static canMakePaymentsWithActiveCard(merchantIdentifier: string): Promise<boolean>;

  constructor(version: number, paymentRequest: ApplePayPaymentRequest);

  onvalidatemerchant: (event: ApplePayValidateMerchantEvent) => void;
  onpaymentauthorized: (event: ApplePayPaymentAuthorizedEvent) => void;
  oncancel: (event: ApplePayCancelEvent) => void;

  begin(): void;
  completePayment(status: number): void;
  completeMerchantValidation(merchantSession: any): void;
}

interface ApplePayPaymentRequest {
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  total: ApplePayLineItem;
}

interface ApplePayLineItem {
  label: string;
  amount: string;
}

interface ApplePayValidateMerchantEvent {
  validationURL: string;
}

interface ApplePayPaymentAuthorizedEvent {
  payment: ApplePayPayment;
}

interface ApplePayCancelEvent {
  // Empty for now
}

interface ApplePayPayment {
  token: ApplePayPaymentToken;
  billingContact?: ApplePayPaymentContact;
  shippingContact?: ApplePayPaymentContact;
}

interface ApplePayPaymentToken {
  paymentData: any;
  paymentMethod: ApplePayPaymentMethod;
  transactionIdentifier: string;
}

interface ApplePayPaymentMethod {
  displayName: string;
  network: string;
  type: string;
}

interface ApplePayPaymentContact {
  phoneNumber?: string;
  emailAddress?: string;
  givenName?: string;
  familyName?: string;
  addressLines?: string[];
  locality?: string;
  administrativeArea?: string;
  postalCode?: string;
  countryCode?: string;
}

export {};