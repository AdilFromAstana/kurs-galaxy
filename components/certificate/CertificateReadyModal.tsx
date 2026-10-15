"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Award, Download, ShieldCheck, X } from "lucide-react";
import { useLandingContent } from "@/hooks/useLandingContent";
import { DEFAULT_TEXTS } from "@/lib/landingContentShared";

// Окно сразу после прохождения курса: сертификат уже выдан, его можно скачать.
// Скачивание — по нажатию ссылки: открытие вкладки из кода телефоны блокируют.
export default function CertificateReadyModal({
  open,
  onClose,
  courseId,
  courseTitle,
  certificateId,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  certificateId: string;
}) {
  const t = useLandingContent()?.texts ?? DEFAULT_TEXTS;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-ready-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl bg-white p-7 text-center shadow-2xl sm:rounded-3xl md:p-9"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-400 text-white shadow-lg">
          <Award className="h-11 w-11" aria-hidden />
        </div>
        <h2 id="cert-ready-title" className="mt-5 text-2xl font-extrabold text-dark-900">
          {t.certTitle} 🎉
        </h2>
        <p className="mt-3 text-dark-600">{t.certText.replace("{курс}", courseTitle)}</p>
        <p className="mt-2 text-xs text-dark-400">Сертификат № {certificateId}</p>

        <a
          href={`/api/courses/${courseId}/certificate`}
          className="btn btn-primary mt-6 inline-flex w-full items-center justify-center gap-2"
        >
          <Download className="h-5 w-5" aria-hidden />
          {t.certButton}
        </a>
        <Link
          href={`/cert/verify/${certificateId}`}
          target="_blank"
          className="mt-3 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-primary-700 hover:underline"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Проверить подлинность
        </Link>
        <p className="mt-4 text-xs text-dark-400">Сертификат всегда можно скачать снова в разделе «Профиль».</p>
      </div>
    </div>
  );
}
