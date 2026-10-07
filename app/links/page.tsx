import LinksPage from "@/components/landing/LinksPage";
import { shareMetadata } from "@/lib/courseLinkMetadata";

// Одна ссылка для профиля Instagram — внутри кнопки на оба курса
export const dynamic = "force-dynamic";
export const generateMetadata = () => shareMetadata("links");

export default function Page() {
  return <LinksPage />;
}
