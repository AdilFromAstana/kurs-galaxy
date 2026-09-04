'use client';

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type RouteLoadingContextValue = {
  /** Показать индикатор вручную — например перед router.push() после сабмита формы */
  start: () => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextValue>({
  start: () => {},
});

export function useRouteLoading() {
  return useContext(RouteLoadingContext);
}

// Небольшая задержка перед показом — чтобы мгновенные переходы (страница
// уже закэширована Next.js) не мигали индикатором зря.
const SHOW_DELAY_MS = 150;
// Страховка: если по какой-то причине смена pathname не поймалась
// (переход на внешний хэш и т.п.) — не оставляем полоску висеть вечно.
const SAFETY_TIMEOUT_MS = 6000;

function RouteChangeWatcher({ onRouteChange }: { onRouteChange: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onRouteChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}

export function RouteLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
  };

  const start = useCallback(() => {
    clearTimers();
    showTimer.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    safetyTimer.current = setTimeout(() => {
      setVisible(false);
    }, SAFETY_TIMEOUT_MS);
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    setVisible(false);
  }, []);

  useEffect(() => clearTimers, []);

  // Ловим клики по любым внутренним ссылкам (в т.ч. <Link>, который рендерится
  // в обычный <a>) и включаем индикатор ещё до того, как Next начнёт менять роут.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.origin !== window.location.origin) return;

      const samePath =
        anchor.pathname === window.location.pathname &&
        anchor.search === window.location.search;
      if (samePath) return;

      start();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [start]);

  return (
    <RouteLoadingContext.Provider value={{ start }}>
      <Suspense fallback={null}>
        <RouteChangeWatcher onRouteChange={stop} />
      </Suspense>
      <div
        aria-hidden={!visible}
        className={`fixed top-0 left-0 right-0 z-[200] h-[3px] pointer-events-none transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="h-full w-full bg-primary-100/70 overflow-hidden">
          <div className="h-full w-1/3 bg-primary-600 rounded-full animate-route-bar" />
        </div>
      </div>
      {children}
    </RouteLoadingContext.Provider>
  );
}
