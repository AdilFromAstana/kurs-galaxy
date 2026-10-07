import LandingPage from "@/components/landing/LandingPage";
import { shareMetadata } from "@/lib/courseLinkMetadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => shareMetadata("home");

export default function HomePage() {
  return <LandingPage />;
}
