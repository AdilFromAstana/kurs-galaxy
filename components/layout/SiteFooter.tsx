'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MessageCircle, Send, Instagram } from 'lucide-react';

interface PublicSiteSettings {
  contactPhone: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  contactTelegram: string | null;
  contactInstagram: string | null;
  legalEntityName: string | null;
  legalRequisites: string | null;
  legalAddress: string | null;
}

const EMPTY: PublicSiteSettings = {
  contactPhone: null,
  contactEmail: null,
  contactWhatsapp: null,
  contactTelegram: null,
  contactInstagram: null,
  legalEntityName: null,
  legalRequisites: null,
  legalAddress: null,
};

export default function SiteFooter() {
  const [s, setS] = useState<PublicSiteSettings>(EMPTY);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/site-settings/public');
        if (!cancel && res.ok) {
          const data = await res.json();
          setS(data.settings ?? EMPTY);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const year = new Date().getFullYear();
  const hasContacts =
    s.contactPhone ||
    s.contactEmail ||
    s.contactWhatsapp ||
    s.contactTelegram ||
    s.contactInstagram;

  return (
    <footer className="border-t border-gray-200 bg-white mt-12 md:mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Бренд + юр-инфо */}
          <div>
            <p className="font-bold text-lg text-dark-900 mb-3">
              KursGalaxy.kz
            </p>
            <p className="text-sm text-dark-600 leading-relaxed">
              Профессиональное онлайн-обучение для специалистов
              beauty-индустрии.
            </p>
            {(s.legalEntityName || s.legalRequisites || s.legalAddress) && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-dark-500 space-y-1 leading-relaxed">
                {s.legalEntityName && <p>{s.legalEntityName}</p>}
                {s.legalRequisites && <p>ИИН/БИН: {s.legalRequisites}</p>}
                {s.legalAddress && <p>{s.legalAddress}</p>}
              </div>
            )}
          </div>

          {/* Ссылки */}
          <div>
            <p className="font-semibold text-dark-900 mb-3">Информация</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/legal/contacts"
                  className="text-dark-600 hover:text-primary-600 transition-colors"
                >
                  Контакты
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/offer"
                  className="text-dark-600 hover:text-primary-600 transition-colors"
                >
                  Договор-оферта
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-dark-600 hover:text-primary-600 transition-colors"
                >
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/refund"
                  className="text-dark-600 hover:text-primary-600 transition-colors"
                >
                  Условия возврата
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="text-dark-600 hover:text-primary-600 transition-colors"
                >
                  Каталог курсов
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <p className="font-semibold text-dark-900 mb-3">
              Связаться с нами
            </p>
            {hasContacts ? (
              <ul className="space-y-2 text-sm">
                {s.contactPhone && (
                  <li>
                    <a
                      href={`tel:${s.contactPhone.replace(/[^+\d]/g, '')}`}
                      className="text-dark-600 hover:text-primary-600 inline-flex items-center gap-2 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {s.contactPhone}
                    </a>
                  </li>
                )}
                {s.contactEmail && (
                  <li>
                    <a
                      href={`mailto:${s.contactEmail}`}
                      className="text-dark-600 hover:text-primary-600 inline-flex items-center gap-2 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {s.contactEmail}
                    </a>
                  </li>
                )}
                {s.contactWhatsapp && (
                  <li>
                    <a
                      href={s.contactWhatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-dark-600 hover:text-primary-600 inline-flex items-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </li>
                )}
                {s.contactTelegram && (
                  <li>
                    <a
                      href={s.contactTelegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-dark-600 hover:text-primary-600 inline-flex items-center gap-2 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Telegram
                    </a>
                  </li>
                )}
                {s.contactInstagram && (
                  <li>
                    <a
                      href={s.contactInstagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-dark-600 hover:text-primary-600 inline-flex items-center gap-2 transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-dark-500">
                Контакты будут указаны в ближайшее время.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center text-xs text-dark-400">
          © {year} KursGalaxy.kz · Все права защищены
        </div>
      </div>
    </footer>
  );
}
