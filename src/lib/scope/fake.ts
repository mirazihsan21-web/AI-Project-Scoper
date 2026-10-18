import type { CallModel } from "./generate";
import type { Scope } from "./schema";

// Returned when SCOPER_FAKE_LLM=1, so e2e tests and offline dev never call Groq.
export const FAKE_SCOPE: Scope = {
  projectTitle: "Gym Class Booking App",
  summary:
    "A mobile-first web app where gym members book classes and pay monthly, and trainers see their schedule.",
  projectType: "web_app",
  assumptions: [
    "One gym location to start",
    "Card payments through a hosted provider",
    "Members use phones, so the web app is mobile-first",
  ],
  openQuestions: [
    "How many members and classes per week today?",
    "Which WhatsApp number would send reminders?",
    "Do trainers need to cancel or move classes themselves?",
  ],
  features: [
    { name: "Member Accounts", description: "Members sign up and log in with email.", priority: "must", complexity: "s" },
    { name: "Class Timetable", description: "Members browse upcoming classes with free spots.", priority: "must", complexity: "s" },
    { name: "Class Booking", description: "Members book and cancel a class spot.", priority: "must", complexity: "m" },
    { name: "Monthly Membership Billing", description: "Members pay a recurring monthly fee by card.", priority: "must", complexity: "m" },
    { name: "Trainer Schedule", description: "Trainers see their classes and who booked.", priority: "should", complexity: "s" },
    { name: "WhatsApp Reminders", description: "Members get a reminder before each booked class.", priority: "could", complexity: "m" },
  ],
  integrations: [
    { name: "Stripe Billing", purpose: "Recurring monthly membership payments", complexity: "m" },
    { name: "WhatsApp Business API", purpose: "Class reminder messages", complexity: "m" },
  ],
  risks: [
    { title: "Tight budget", detail: "Full scope may exceed what the owner expects to spend.", severity: "medium", mitigation: "Ship must-haves first and add the rest later." },
    { title: "WhatsApp approval", detail: "Message templates need Meta approval, which can take days.", severity: "low", mitigation: "Submit templates in the first week." },
  ],
  milestones: [
    { name: "Booking MVP", goal: "Members can sign up, browse and book classes.", featureNames: ["Member Accounts", "Class Timetable", "Class Booking"] },
    { name: "Payments", goal: "Members pay monthly and access is tied to payment.", featureNames: ["Monthly Membership Billing"] },
    { name: "Trainer and Reminders", goal: "Trainers manage their day and members get reminders.", featureNames: ["Trainer Schedule", "WhatsApp Reminders"] },
  ],
};

export const fakeCaller: CallModel = async () => ({
  content: JSON.stringify(FAKE_SCOPE),
  inputTokens: 0,
  outputTokens: 0,
});
