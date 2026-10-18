import type { Scope } from "@/lib/scope/schema";

// Hand-written scope for a small bakery ordering app. Shape matches what the LLM returns.
export const sampleScope: Scope = {
  projectTitle: "Bakery Online Ordering",
  summary:
    "A mobile-friendly web app where customers order cakes for pickup and the owner manages orders.",
  projectType: "web_app",
  assumptions: ["Single bakery location", "Owner handles fulfilment manually"],
  openQuestions: ["Do you need delivery or pickup only?"],
  features: [
    {
      name: "Online Ordering",
      description: "Customers browse the menu and place pickup orders.",
      priority: "must",
      type: "cart_checkout",
    },
    {
      name: "Admin Dashboard",
      description: "Owner sees and updates order status.",
      priority: "should",
      type: "records_management",
    },
    {
      name: "Customer Reviews",
      description: "Customers rate and review their order.",
      priority: "could",
      type: "reviews_ratings",
    },
  ],
  integrations: [
    { name: "Stripe", purpose: "Card payments at checkout", type: "payment_provider" },
  ],
  risks: [
    {
      title: "Payment disputes",
      detail: "Custom cakes are non-refundable once started.",
      severity: "medium",
      mitigation: "Show the refund policy before checkout.",
    },
  ],
  milestones: [
    { name: "MVP launch", goal: "Take real orders", featureNames: ["Online Ordering"] },
    {
      name: "Operations",
      goal: "Owner tooling",
      featureNames: ["admin dashboard", "Feature That Does Not Exist"],
    },
  ],
};
