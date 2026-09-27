import { Manrope } from "next/font/google";

// Шрифт публичной части сайта (главная, каталог, страница курса)
export const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});
