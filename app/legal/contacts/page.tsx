import Link from 'next/link';
import {
  Phone,
  Mail,
  MessageCircle,
  Send,
  Instagram,
  Building,
  ArrowLeft,
} from 'lucide-react';
import { loadOrCreateSiteSettings } from '@/lib/siteSettings';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Контакты — KursGalaxy.kz',
};

export default async function ContactsPage() {
  const s = await loadOrCreateSiteSettings();

  const channels = [
    s.contactPhone && {
      label: 'Телефон',
      value: s.contactPhone,
      href: `tel:${s.contactPhone.replace(/[^+\d]/g, '')}`,
      icon: Phone,
      color: 'text-blue-600 bg-blue-50',
    },
    s.contactEmail && {
      label: 'Email',
      value: s.contactEmail,
      href: `mailto:${s.contactEmail}`,
      icon: Mail,
      color: 'text-purple-600 bg-purple-50',
    },
    s.contactWhatsapp && {
      label: 'WhatsApp',
      value: s.contactWhatsapp.replace(/^https?:\/\//, ''),
      href: s.contactWhatsapp,
      icon: MessageCircle,
      color: 'text-green-600 bg-green-50',
    },
    s.contactTelegram && {
      label: 'Telegram',
      value: s.contactTelegram.replace(/^https?:\/\//, ''),
      href: s.contactTelegram,
      icon: Send,
      color: 'text-sky-600 bg-sky-50',
    },
    s.contactInstagram && {
      label: 'Instagram',
      value: s.contactInstagram.replace(/^https?:\/\//, ''),
      href: s.contactInstagram,
      icon: Instagram,
      color: 'text-pink-600 bg-pink-50',
    },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    href: string;
    icon: typeof Phone;
    color: string;
  }>;

  return (
    <div className="container-custom max-w-4xl py-8 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        На главную
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-dark-900 mb-3">
          Контакты
        </h1>
        <p className="text-base md:text-lg text-dark-600">
          Свяжитесь с нами любым удобным способом
        </p>
      </div>

      {channels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {channels.map(({ label, value, href, icon: Icon, color }) => (
            <a
              key={label}
              href={href}
              target={
                href.startsWith('http') && !href.startsWith('http://localhost')
                  ? '_blank'
                  : undefined
              }
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-dark-500 uppercase tracking-wide font-medium">
                  {label}
                </p>
                <p className="text-base font-semibold text-dark-900 truncate group-hover:text-primary-600 transition-colors">
                  {value}
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <p className="text-sm text-amber-900">
            Контакты будут добавлены в ближайшее время. Если у вас есть
            вопросы — попробуйте написать нам через форму регистрации, мы
            ответим на ваш email.
          </p>
        </div>
      )}

      {/* Юр-инфо */}
      {(s.legalEntityName || s.legalRequisites || s.legalAddress) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <h2 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-primary-600" />
            Реквизиты
          </h2>
          <div className="space-y-3 text-sm md:text-base">
            {s.legalEntityName && (
              <div>
                <p className="text-xs text-dark-500 uppercase tracking-wide font-medium mb-1">
                  Наименование
                </p>
                <p className="text-dark-900">{s.legalEntityName}</p>
              </div>
            )}
            {s.legalRequisites && (
              <div>
                <p className="text-xs text-dark-500 uppercase tracking-wide font-medium mb-1">
                  ИИН / БИН
                </p>
                <p className="text-dark-900 font-mono">
                  {s.legalRequisites}
                </p>
              </div>
            )}
            {s.legalAddress && (
              <div>
                <p className="text-xs text-dark-500 uppercase tracking-wide font-medium mb-1">
                  Юридический адрес
                </p>
                <p className="text-dark-900">{s.legalAddress}</p>
              </div>
            )}
            {s.legalRegisteredAt && (
              <div>
                <p className="text-xs text-dark-500 uppercase tracking-wide font-medium mb-1">
                  Дата регистрации
                </p>
                <p className="text-dark-900">{s.legalRegisteredAt}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Юр-ссылки */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
        <Link
          href="/legal/offer"
          className="text-primary-600 hover:text-primary-700"
        >
          Договор-оферта
        </Link>
        <Link
          href="/legal/privacy"
          className="text-primary-600 hover:text-primary-700"
        >
          Политика конфиденциальности
        </Link>
        <Link
          href="/legal/refund"
          className="text-primary-600 hover:text-primary-700"
        >
          Условия возврата
        </Link>
      </div>
    </div>
  );
}
