"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useLandingContent } from "@/hooks/useLandingContent";
import { focusRing, manrope } from "@/components/landing/shared";

// Одна ссылка для профиля Instagram: фото и имя автора, кнопки на оба курса
// и WhatsApp. Всё берётся из админки («Об авторе», «Тексты и кнопки»).
export default function LinksPage() {
  const c = useLandingContent();
  const t = c?.texts;
  const wa = c?.whatsapp
    ? `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(t?.siteGreeting ?? "")}`
    : null;

  const courses = t
    ? [
        { href: "/brow", title: t.tabBrow, note: t.linksBrowNote },
        { href: "/permanent", title: t.tabPermanent, note: t.linksPermanentNote },
      ]
    : [];

  return (
    <>
      <main className={`${manrope.className} min-h-screen bg-gradient-to-b from-landing-blush to-white px-4 pb-16 pt-14 text-landing-plum`}>
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          {!c ? (
            <div className="mt-10 h-72 w-full animate-pulse rounded-[28px] bg-white/70" aria-busy="true" />
          ) : (
            <>
              {c.authorPhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.authorPhoto}
                  alt={c.authorName || "Автор курсов"}
                  className="h-28 w-28 rounded-full object-cover object-[40%_35%] shadow-[0_20px_40px_-20px_rgba(86,62,79,0.6)] ring-4 ring-white"
                />
              )}
              {c.authorName && (
                <h1 className="mt-5 text-2xl font-extrabold uppercase tracking-tight">{c.authorName}</h1>
              )}
              {c.authorRole && <p className="mt-1 text-sm font-semibold text-landing-pink">{c.authorRole}</p>}

              <ul className="mt-8 w-full space-y-3">
                {courses.map((x) => (
                  <li key={x.href}>
                    <Link
                      href={x.href}
                      className={`group flex items-center gap-4 rounded-[24px] bg-white p-5 text-left shadow-[0_15px_35px_-20px_rgba(86,62,79,0.45)] ring-1 ring-landing-plum/5 transition-transform hover:-translate-y-0.5 ${focusRing}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-extrabold uppercase leading-tight">{x.title}</span>
                        {x.note && <span className="mt-1 block text-sm text-landing-plum/70">{x.note}</span>}
                      </span>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-landing-pink text-white transition-transform group-hover:translate-x-0.5">
                        <ArrowRight className="h-5 w-5" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
                {wa && (
                  <li>
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-3 rounded-[24px] bg-[#25D366] p-4 font-bold text-white shadow-[0_15px_35px_-20px_rgba(37,211,102,0.9)] transition-transform hover:-translate-y-0.5 ${focusRing}`}
                    >
                      <WhatsAppIcon className="h-6 w-6" />
                      {t?.linksWhatsapp}
                    </a>
                  </li>
                )}
              </ul>

              <Link href="/" className="mt-8 text-sm font-semibold text-landing-plum/70 underline hover:text-landing-pink">
                {t?.siteName}
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  );
}
