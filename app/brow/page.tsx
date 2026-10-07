import LandingPage from "@/components/landing/LandingPage";
import { shareMetadata } from "@/lib/courseLinkMetadata";

// Отдельная ссылка на курс — для Instagram и рассылок: открывает главную сразу на нужной вкладке.
// Превью считается при каждом запросе (тексты из админки, полный адрес картинки).
export const dynamic = "force-dynamic";
export const generateMetadata = () => shareMetadata("brow");

export default function Page() {
  return <LandingPage initialTab="brow" />;
}
