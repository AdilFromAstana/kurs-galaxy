import LandingPage from "@/components/landing/LandingPage";
import { courseLinkMetadata } from "@/lib/courseLinkMetadata";

// Отдельная ссылка на курс — для Instagram и рассылок: открывает главную сразу на нужной вкладке
export const generateMetadata = () => courseLinkMetadata("brow");

export default function Page() {
  return <LandingPage initialTab="brow" />;
}
