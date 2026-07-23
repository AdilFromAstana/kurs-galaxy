'use client';

import { useEffect, useState } from 'react';
import {
  Globe,
  Phone,
  Mail,
  MessageCircle,
  Send,
  Instagram,
  FileText,
  Building,
  Save,
  AlertCircle,
  Check,
} from 'lucide-react';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import toast from 'react-hot-toast';

type Settings = {
  contactPhone: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  contactTelegram: string | null;
  contactInstagram: string | null;
  legalEntityName: string | null;
  legalRequisites: string | null;
  legalAddress: string | null;
  legalRegisteredAt: string | null;
  offerText: string | null;
  privacyText: string | null;
  refundText: string | null;
};

const EMPTY: Settings = {
  contactPhone: '',
  contactEmail: '',
  contactWhatsapp: '',
  contactTelegram: '',
  contactInstagram: '',
  legalEntityName: '',
  legalRequisites: '',
  legalAddress: '',
  legalRegisteredAt: '',
  offerText: '',
  privacyText: '',
  refundText: '',
};

function nullsToStrings(s: Settings): Settings {
  return Object.fromEntries(
    Object.entries(s).map(([k, v]) => [k, v ?? '']),
  ) as Settings;
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetch('/api/admin/site-settings', {
        credentials: 'include',
      });
      if (!cancel && res.ok) {
        const data = await res.json();
        setSettings(nullsToStrings(data.settings));
      }
      if (!cancel) setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || data.error || 'Не удалось сохранить');
        return;
      }
      setSettings(nullsToStrings(data.settings));
      setSuccess(true);
      toast.success('Настройки сайта сохранены');
      setTimeout(() => setSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8 max-w-5xl">
      <SettingsTabs />
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary-600" />
            Сайт и контакты
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Контакты в футере, реквизиты ИП, тексты юридических страниц
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg font-semibold disabled:opacity-50"
        >
          {success ? (
            <>
              <Check className="w-5 h-5" />
              Сохранено
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Контакты */}
      <section className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary-600" />
          Контакты для футера и юр-страниц
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Телефон"
            icon={<Phone className="w-4 h-4" />}
            placeholder="+7 (777) 123-45-67"
            value={settings.contactPhone ?? ''}
            onChange={(v) => update({ contactPhone: v })}
          />
          <Input
            label="Email поддержки"
            icon={<Mail className="w-4 h-4" />}
            placeholder="support@kursgalaxy.kz"
            type="email"
            value={settings.contactEmail ?? ''}
            onChange={(v) => update({ contactEmail: v })}
          />
          <Input
            label="WhatsApp (ссылка wa.me)"
            icon={<MessageCircle className="w-4 h-4" />}
            placeholder="https://wa.me/77771234567"
            value={settings.contactWhatsapp ?? ''}
            onChange={(v) => update({ contactWhatsapp: v })}
          />
          <Input
            label="Telegram (ссылка t.me)"
            icon={<Send className="w-4 h-4" />}
            placeholder="https://t.me/kursgalaxy"
            value={settings.contactTelegram ?? ''}
            onChange={(v) => update({ contactTelegram: v })}
          />
          <div className="md:col-span-2">
            <Input
              label="Instagram (ссылка)"
              icon={<Instagram className="w-4 h-4" />}
              placeholder="https://instagram.com/kursgalaxy"
              value={settings.contactInstagram ?? ''}
              onChange={(v) => update({ contactInstagram: v })}
            />
          </div>
        </div>
      </section>

      {/* Юр. лицо */}
      <section className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Реквизиты юр. лица / ИП
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Эти данные показываются в подвале сайта и в договоре-оферте.
          Обязательны для работы с платёжкой и приёма платежей в РК.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Наименование"
            placeholder="ИП Айжанов Адиль"
            value={settings.legalEntityName ?? ''}
            onChange={(v) => update({ legalEntityName: v })}
          />
          <Input
            label="ИИН / БИН"
            placeholder="930101300123"
            value={settings.legalRequisites ?? ''}
            onChange={(v) => update({ legalRequisites: v })}
          />
          <div className="md:col-span-2">
            <Input
              label="Юридический адрес"
              placeholder="г. Алматы, ул. Абая 1, кв. 1"
              value={settings.legalAddress ?? ''}
              onChange={(v) => update({ legalAddress: v })}
            />
          </div>
          <Input
            label="Дата регистрации (опционально)"
            placeholder="01.01.2025"
            value={settings.legalRegisteredAt ?? ''}
            onChange={(v) => update({ legalRegisteredAt: v })}
          />
        </div>
      </section>

      {/* Тексты юр-страниц */}
      <section className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" />
          Юридические тексты
        </h2>
        <p className="text-sm text-gray-600 mb-5">
          Если оставить пустым — на странице будет показан типовой шаблон с
          подставленными вашими реквизитами. Для полноценного запуска
          рекомендуется адаптировать тексты у юриста и вставить сюда.
          Поддерживается Markdown.
        </p>

        <Textarea
          label="Договор-оферта"
          rows={10}
          placeholder="Оставьте пустым — будет использован типовой шаблон..."
          value={settings.offerText ?? ''}
          onChange={(v) => update({ offerText: v })}
        />
        <Textarea
          label="Политика конфиденциальности"
          rows={10}
          placeholder="Оставьте пустым — будет использован типовой шаблон..."
          value={settings.privacyText ?? ''}
          onChange={(v) => update({ privacyText: v })}
        />
        <Textarea
          label="Условия возврата"
          rows={8}
          placeholder="Оставьте пустым — будет использован типовой шаблон..."
          value={settings.refundText ?? ''}
          onChange={(v) => update({ refundText: v })}
        />
      </section>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
      />
    </div>
  );
}
