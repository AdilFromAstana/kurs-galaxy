"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, KeyRound, Loader2, XCircle } from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import { useCourses } from "@/components/providers/CoursesProvider";
import { useLandingContent } from "@/hooks/useLandingContent";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { manrope, outlineButtonCls, pinkButtonCls } from "@/components/landing/shared";

// Ссылка-приглашение на курс. Гость видит, к какому курсу его пригласили, и входит /
// регистрируется — после чего возвращается сюда, и доступ открывается автоматически.

type Info =
  | { ok: true; course: { id: string; title: string }; accessDays: number | null }
  | { ok: false; reason: string };

const REASONS: Record<string, string> = {
  not_found: "Такой ссылки нет. Проверьте, что скопировали её целиком.",
  disabled: "Эта ссылка больше не действует.",
  used_up: "По этой ссылке доступ уже получили. Попросите у автора новую ссылку.",
  course_hidden: "Курс сейчас недоступен.",
  revoked: "Доступ к курсу по этой ссылке закрыт автором.",
};

function days(n: number) {
  const m10 = n % 10, m100 = n % 100;
  const w = m100 >= 11 && m100 <= 14 ? "дней" : m10 === 1 ? "день" : m10 >= 2 && m10 <= 4 ? "дня" : "дней";
  return `${n} ${w}`;
}

export default function AccessLinkPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const session = useSession();
  const { refresh: refreshCourses } = useCourses();
  const landing = useLandingContent();
  const [info, setInfo] = useState<Info | null>(null);
  const [claim, setClaim] = useState<"idle" | "busy" | { done: string } | { error: string }>("idle");
  const started = useRef(false);

  useEffect(() => {
    fetch(`/api/access/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo({ ok: false, reason: "network" }));
  }, [token]);

  // Ученица вошла — сразу открываем доступ (один раз). «Уже использована» — тоже пробуем:
  // если это её собственная ссылка (открыла из закладок), сервер просто пустит в курс.
  const canTry = !!info && (info.ok || info.reason === "used_up");
  useEffect(() => {
    if (!canTry || session.isLoading || !session.user || started.current) return;
    started.current = true;
    setClaim("busy");
    (async () => {
      const res = await fetch(`/api/access/${encodeURIComponent(token)}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setClaim({ error: REASONS[data.reason] ?? "Не удалось открыть доступ. Попробуйте ещё раз." });
        return;
      }
      await session.refresh();
      await refreshCourses();
      setClaim({ done: data.courseId });
      setTimeout(() => router.push(`/course/${data.courseId}`), 1500);
    })();
  }, [canTry, session, token, router, refreshCourses]);

  const next = `/access/${encodeURIComponent(token)}`;
  const wa = landing?.whatsapp ? `https://wa.me/${landing.whatsapp}` : null;

  let body: React.ReactNode;
  if (!info || (canTry && (session.isLoading || claim === "busy" || (session.user && claim === "idle")))) {
    body = (
      <div className="flex flex-col items-center gap-3 py-6">
        <Loader2 className="h-10 w-10 animate-spin text-landing-pink" aria-hidden />
        <p className="text-landing-plum/80">{claim === "busy" ? "Открываем доступ…" : "Проверяем ссылку…"}</p>
      </div>
    );
  } else if (typeof claim === "object" && "done" in claim) {
    body = (
      <>
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" aria-hidden />
        <h1 className="mt-4 text-2xl font-extrabold">Доступ открыт!</h1>
        <p className="mt-2 text-landing-plum/80">
          {info.ok ? `Курс «${info.course.title}» уже в вашем кабинете.` : "Курс уже в вашем кабинете."} Переходим к урокам…
        </p>
        <Link href={`/course/${claim.done}`} className={`${pinkButtonCls} mt-6 w-full`}>Перейти к курсу</Link>
      </>
    );
  } else if (!info.ok || typeof claim === "object") {
    const msg = typeof claim === "object" && "error" in claim ? claim.error : REASONS[info.ok ? "" : info.reason] ?? "Не удалось проверить ссылку. Обновите страницу.";
    body = (
      <>
        <XCircle className="mx-auto h-14 w-14 text-landing-pink" aria-hidden />
        <h1 className="mt-4 text-2xl font-extrabold">Ссылка не сработала</h1>
        <p className="mt-2 text-landing-plum/80">{msg}</p>
        <div className="mt-6 flex flex-col gap-3">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={`${pinkButtonCls} w-full`}>
              <WhatsAppIcon className="h-5 w-5" /> Написать автору
            </a>
          )}
          <Link href="/" className={`${outlineButtonCls} w-full`}>На главную</Link>
        </div>
      </>
    );
  } else {
    // Гость: предлагаем войти или зарегистрироваться и вернуться сюда
    body = (
      <>
        <KeyRound className="mx-auto h-14 w-14 text-landing-pink" aria-hidden />
        <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-landing-pink">Вам открыт доступ к курсу</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-extrabold uppercase leading-tight">{info.course.title}</h1>
        <p className="mt-3 text-landing-plum/80">
          {info.accessDays ? `Доступ на ${days(info.accessDays)} после активации.` : "Доступ без ограничения по времени."}{" "}
          Чтобы начать, создайте аккаунт или войдите — уроки сохранятся в вашем кабинете.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href={`/auth/register?next=${encodeURIComponent(next)}`} className={`${pinkButtonCls} w-full`}>
            Создать аккаунт
          </Link>
          <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className={`${outlineButtonCls} w-full`}>
            У меня уже есть аккаунт
          </Link>
        </div>
      </>
    );
  }

  return (
    <main className={`${manrope.className} flex min-h-screen items-center justify-center bg-gradient-to-b from-landing-blush to-white px-4 py-12 text-landing-plum`}>
      <div className="w-full max-w-md rounded-[32px] bg-white p-7 text-center shadow-[0_30px_70px_-30px_rgba(86,62,79,0.45)] ring-1 ring-landing-plum/5 md:p-9">
        {body}
      </div>
    </main>
  );
}
