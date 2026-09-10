import { LegalScreen } from "@/components/legal-content";

export default function PrivacyPolicyScreen() {
  return (
    <LegalScreen
      title="Privacy policy"
      updatedAt="September 2026"
      sections={[
        {
          heading: "Information we collect",
          body: "When you create an account, we collect your name and email address through Clerk, our authentication provider. When you plan a trip, we collect the destination, dates, budget, traveler count, and interests you provide so we can generate an itinerary.",
        },
        {
          heading: "How we use your information",
          body: "We use your trip details to generate itineraries and budget estimates through our AI planning service, and your account information to secure your sign-in and sync your trips across devices.",
        },
        {
          heading: "Data sharing",
          body: "We share trip details with the AI and image providers we use to generate itineraries and cover photos. We don't sell your personal information to third parties.",
        },
        {
          heading: "Data retention & deletion",
          body: "Your trips and messages are stored until you delete them or delete your account. Deleting your account from Profile removes your account and all associated trips permanently.",
        },
        {
          heading: "Your rights",
          body: "You can review and delete your data at any time from the Profile tab. Contact us if you'd like a copy of your data or have questions about how it's handled.",
        },
        {
          heading: "Contact us",
          body: "Questions about this policy? Reach us at support@triply.app.",
        },
      ]}
    />
  );
}
