import type { FeatureType, IntegrationType } from "@/lib/scope/catalog";
import type { PROJECT_TYPES, PRIORITIES, SEVERITIES } from "@/lib/scope/schema";

// Plain-language names for the codes the model returns. Records keep every code covered.

export const PROJECT_TYPE_LABELS: Record<(typeof PROJECT_TYPES)[number], string> = {
  website: "Website",
  web_app: "Web app",
  mobile_app: "Mobile app",
  ecommerce: "Online shop",
  marketplace: "Marketplace",
  saas: "Software as a service",
  ai_feature: "AI feature",
  internal_tool: "Internal tool",
  other: "Software project",
};

export const PRIORITY_LABELS: Record<(typeof PRIORITIES)[number], string> = {
  must: "Must have",
  should: "Should have",
  could: "Could have",
};

export const SEVERITY_LABELS: Record<(typeof SEVERITIES)[number], string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

export const FEATURE_TYPE_LABELS: Record<FeatureType, string> = {
  content_pages: "Content pages",
  accounts: "Accounts and login",
  records_management: "Managing records",
  search_filtering: "Search and filters",
  booking_scheduling: "Booking and scheduling",
  cart_checkout: "Cart and checkout",
  payments_billing: "Payments and billing",
  messaging_chat: "Messaging",
  notifications: "Notifications",
  dashboard_reporting: "Dashboards and reports",
  teams_permissions: "Teams and permissions",
  reviews_ratings: "Reviews and ratings",
  media_files: "Photos and files",
  maps_location: "Maps and location",
  ai_assistant: "AI assistant",
  data_import_sync: "Data import and sync",
  matching_marketplace: "Marketplace matching",
  other: "Custom feature",
};

export const INTEGRATION_TYPE_LABELS: Record<IntegrationType, string> = {
  payment_provider: "Payments",
  messaging_provider: "Messaging",
  calendar: "Calendar",
  maps_geo: "Maps",
  auth_provider: "Sign-in",
  ai_provider: "AI service",
  ecommerce_platform: "E-commerce platform",
  crm_helpdesk: "CRM or help desk",
  accounting: "Accounting",
  legacy_system: "Existing system",
  other_api: "Third-party service",
};
