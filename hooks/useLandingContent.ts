'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_TEXTS, type LandingContentData, type LandingTexts } from '@/lib/landingContentShared';

// Контент главной (Админка → Контент сайта). Один запрос на загрузку страницы:
// его используют главная, шапка, мобильное меню и футер — чтобы пункты меню
// скрывались вместе с пустыми блоками.

let cache: Promise<LandingContentData | null> | null = null;

export function fetchLandingContent(): Promise<LandingContentData | null> {
  if (!cache) {
    cache = fetch('/api/site-content/public')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.content as LandingContentData) ?? null)
      .catch(() => null);
  }
  return cache;
}

/** Сбросить кэш — после сохранения в админке. */
export function invalidateLandingContent() {
  cache = null;
}

export function useLandingContent(): LandingContentData | null {
  const [content, setContent] = useState<LandingContentData | null>(null);
  useEffect(() => {
    let cancel = false;
    fetchLandingContent().then((c) => !cancel && setContent(c));
    return () => {
      cancel = true;
    };
  }, []);
  return content;
}

/** Разделы главной, которые показываются только когда заполнены в админке. */
export type OptionalSection = 'author' | 'reviews' | 'faq';

export function hasSection(c: LandingContentData | null, id: OptionalSection): boolean {
  if (!c) return false;
  switch (id) {
    case 'author':
      return !!(c.authorName || c.authorPhoto);
    case 'reviews':
      return c.reviews.length > 0 && !c.layout.hideReviews;
    case 'faq':
      return c.faq.length > 0 && !c.layout.hideFaq;
  }
}

/** Пункт меню со ссылкой на раздел главной: скрыт, если раздел пустой. */
export function sectionFromHref(href: string): OptionalSection | null {
  const m = href.match(/#([\w-]+)$/);
  const id = m?.[1];
  return id === 'author' || id === 'reviews' || id === 'faq'
    ? id
    : null;
}

/** Тексты сайта из админки; пока не загрузились — тексты по умолчанию (без мигания пустотой). */
export function useSiteTexts(): LandingTexts {
  return useLandingContent()?.texts ?? DEFAULT_TEXTS;
}

/** Пункты меню называются так, как автор назвала их в админке («Тексты и кнопки»). */
export function navLabel(c: LandingContentData | null, href: string, fallback: string): string {
  if (!c) return fallback;
  if (href.endsWith('#brow')) return c.texts.tabBrow;
  if (href.endsWith('#permanent')) return c.texts.tabPermanent;
  if (href.endsWith('#author')) return c.texts.navAuthor;
  if (href.endsWith('#reviews')) return c.texts.navReviews;
  if (href.endsWith('#faq')) return c.texts.navFaq;
  return fallback;
}

/** Вкладки курсов на главной: /#brow и /#permanent открывают нужную. */
export type CourseTab = 'brow' | 'permanent';
export const COURSE_TABS: { id: CourseTab; name: string }[] = [
  { id: 'brow', name: 'Бровист с 0' },
  { id: 'permanent', name: 'Натуральный перманент' },
];
