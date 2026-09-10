import { LegalScreen } from "@/components/legal-content";

export default function TermsOfServiceScreen() {
  return (
    <LegalScreen
      title="Terms of service"
      updatedAt="September 2026"
      sections={[
        {
          heading: "Acceptance of terms",
          body: "By creating an account and using Triply, you agree to these terms. If you don't agree, please don't use the app.",
        },
        {
          heading: "Using Triply",
          body: "Triply helps you plan trips using AI-generated itineraries and budget estimates. You're responsible for verifying details like opening hours, prices, and availability before you travel — itineraries are a starting point, not a booking or guarantee.",
        },
        {
          heading: "Your account",
          body: "You're responsible for keeping your account credentials secure and for all activity under your account. Let us know right away if you suspect unauthorized access.",
        },
        {
          heading: "AI-generated content",
          body: "Itineraries, budget breakdowns, and cover images are generated automatically and may contain errors or inaccuracies. Use your judgment and double-check anything time- or safety-sensitive.",
        },
        {
          heading: "Limitation of liability",
          body: "Triply is provided as-is. We aren't liable for losses arising from travel decisions made based on app content, including missed bookings, inaccurate estimates, or service interruptions.",
        },
        {
          heading: "Changes to these terms",
          body: "We may update these terms as Triply evolves. Continued use of the app after changes means you accept the updated terms.",
        },
        {
          heading: "Contact us",
          body: "Questions about these terms? Reach us at support@triply.app.",
        },
      ]}
    />
  );
}
