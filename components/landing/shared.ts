// Общие элементы дизайна лендинга — используются на главной, в каталоге
// и на странице курса, чтобы публичная часть сайта выглядела единообразно.

export { manrope } from "./font";

export function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function formatPrice(price: number, currency: string) {
  const symbol = currency === "KZT" ? "₸" : currency === "RUB" ? "₽" : currency;
  return `${price.toLocaleString("ru-RU")} ${symbol}`;
}

// Единый видимый фокус для клавиатурной навигации
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-landing-pink/40 focus-visible:ring-offset-2";

export const pinkButtonCls = `inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-landing-pink px-8 py-4 text-sm md:text-base font-bold uppercase tracking-wide text-white shadow-[0_10px_30px_-10px_rgba(245,73,160,0.7)] transition-all hover:bg-landing-pink-dark hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 motion-reduce:transform-none ${focusRing}`;

export const outlineButtonCls = `inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border-2 border-landing-plum/20 bg-white/60 px-8 py-4 text-sm md:text-base font-bold uppercase tracking-wide text-landing-plum transition-colors hover:border-landing-pink hover:text-landing-pink ${focusRing}`;
