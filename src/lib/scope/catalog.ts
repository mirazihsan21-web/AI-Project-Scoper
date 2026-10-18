// The fixed list the model classifies features and integrations into. Hours per type live in
// src/lib/pricing/config.ts. Models agree far more on "this is a booking feature" than on "this is medium".
// Descriptions are sent to the model, so keep them short and concrete.

export const FEATURE_CATALOG = {
  content_pages: "static or CMS-managed pages: about, FAQ, landing, blog",
  accounts: "sign-up, login, password reset, user profile",
  records_management: "create/edit/list one kind of record, incl. simple admin screens (menu items, staff, products)",
  search_filtering: "search, filters and sorting over a catalogue or listings",
  booking_scheduling: "availability, booking and cancelling slots, calendars, waitlists",
  cart_checkout: "cart, checkout, order placement and order status",
  payments_billing: "the user-facing payment flow: deposits, invoices, subscriptions, refunds",
  messaging_chat: "in-app messages, chat or comment threads between users",
  notifications: "email, SMS, push or WhatsApp notifications and reminders",
  dashboard_reporting: "dashboards, reports, charts and data exports",
  teams_permissions: "organisations, invites, roles and permissions",
  reviews_ratings: "ratings and reviews of people, products or orders",
  media_files: "photo, video or document upload, galleries, file sharing",
  maps_location: "maps, location search, distance, live tracking",
  ai_assistant: "the AI capability itself: a chatbot, answers from documents, generated content, recommendations",
  data_import_sync: "bulk import/export, data migration, background sync jobs",
  matching_marketplace: "two-sided marketplace logic: matching buyers with sellers or providers, offers and bids between users",
  other: "anything that fits no type above",
} as const;

export const INTEGRATION_CATALOG = {
  payment_provider: "Stripe, PayPal, Square, bKash and similar",
  messaging_provider: "email, SMS, WhatsApp or push providers such as SendGrid, Twilio, Meta WhatsApp API",
  calendar: "Google Calendar, Outlook, iCal sync",
  maps_geo: "Google Maps, Mapbox, geocoding",
  auth_provider: "Google/Apple sign-in, SSO",
  ai_provider: "LLM, embedding or speech APIs, vector databases",
  ecommerce_platform: "Shopify, WooCommerce, marketplaces",
  crm_helpdesk: "HubSpot, Salesforce, Zendesk, Intercom",
  accounting: "QuickBooks, Xero",
  legacy_system: "on-premise, old or undocumented systems: ERPs, practice-management software",
  other_api: "any other documented third-party API",
} as const;

export type FeatureType = keyof typeof FEATURE_CATALOG;
export type IntegrationType = keyof typeof INTEGRATION_CATALOG;

export const FEATURE_TYPES = Object.keys(FEATURE_CATALOG) as [FeatureType, ...FeatureType[]];
export const INTEGRATION_TYPES = Object.keys(INTEGRATION_CATALOG) as [IntegrationType, ...IntegrationType[]];
