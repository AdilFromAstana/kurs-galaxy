'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Award,
  Upload,
  X,
  Save,
  Image as ImageIcon,
  PenTool,
  QrCode,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/toastConfirm';

type Settings = {
  templateId: string;
  brandName: string;
  brandSubtitle: string;
  titleText: string;
  subtitleText: string;
  introText: string;
  completedText: string;
  signaturePath: string | null;
  instructorName: string | null;
  logoPath: string | null;
  qrEnabled: boolean;
  publicBaseUrl: string;
};

type Template = {
  id: string;
  label: string;
  description: string;
};

export default function CertificateSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewBust, setPreviewBust] = useState(0);

  const sigInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetch('/api/admin/certificate-settings', {
        credentials: 'include',
      });
      if (!cancel && res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setTemplates(data.templates);
      }
      if (!cancel) setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/certificate-settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: settings.templateId,
          brandName: settings.brandName,
          brandSubtitle: settings.brandSubtitle,
          titleText: settings.titleText,
          subtitleText: settings.subtitleText,
          introText: settings.introText,
          completedText: settings.completedText,
          instructorName: settings.instructorName ?? '',
          qrEnabled: settings.qrEnabled,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || data.error || 'Не удалось сохранить');
        return;
      }
      setSettings(data.settings);
      setSuccess(true);
      setPreviewBust(Date.now());
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleAssetUpload = async (
    kind: 'signature' | 'logo',
    file: File,
  ) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Можно загружать только изображения');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Максимум 5 МБ');
      return;
    }

    const formData = new FormData();
    formData.append('kind', kind);
    formData.append('file', file);

    const res = await fetch('/api/admin/certificate-settings/asset', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || data.error || 'Не удалось загрузить');
      return;
    }
    update(
      kind === 'signature'
        ? { signaturePath: data.url }
        : { logoPath: data.url },
    );
    setPreviewBust(Date.now());
  };

  const handleAssetDelete = async (kind: 'signature' | 'logo') => {
    const ok = await confirmToast({
      message: kind === 'signature' ? 'Удалить подпись?' : 'Удалить логотип?',
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(
      `/api/admin/certificate-settings/asset?kind=${kind}`,
      { method: 'DELETE', credentials: 'include' },
    );
    if (res.ok) {
      update(
        kind === 'signature' ? { signaturePath: null } : { logoPath: null },
      );
      setPreviewBust(Date.now());
      toast.success(kind === 'signature' ? 'Подпись удалена' : 'Логотип удалён');
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const previewUrl = `/api/admin/certificate-settings/preview?t=${previewBust}`;

  return (
    <div className="space-y-6 animate-fade-in pb-24 md:pb-8 max-w-7xl">
      <SettingsTabs />
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Award className="w-8 h-8 text-primary-600" />
            Сертификат
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Шаблон сертификата, подпись преподавателя, QR верификации
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
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        {/* Левая колонка — форма */}
        <div className="space-y-6">
          {/* Выбор шаблона */}
          <section className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Шаблон
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {templates.map((tpl) => {
                const active = settings.templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => update({ templateId: tpl.id })}
                    className={`relative text-left p-4 rounded-lg border-2 transition-colors ${
                      active
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 bg-white'
                    }`}
                  >
                    {active && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="font-bold text-gray-900 mb-1">
                      {tpl.label}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {tpl.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Брендинг */}
          <section className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Брендинг
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название академии
                </label>
                <input
                  type="text"
                  value={settings.brandName}
                  onChange={(e) => update({ brandName: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подзаголовок (тагляйн)
                </label>
                <input
                  type="text"
                  value={settings.brandSubtitle}
                  onChange={(e) => update({ brandSubtitle: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Logo */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Логотип академии (PNG/JPG, max 5 МБ)
              </label>
              {settings.logoPath ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={settings.logoPath}
                    alt="Логотип"
                    className="h-14 w-auto bg-white rounded p-1 border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {settings.logoPath.split('/').pop()}
                    </p>
                    <p className="text-xs text-gray-500">Загружено</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssetDelete('logo')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-primary-500 rounded-lg p-6 text-center transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">
                    Загрузить логотип
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Если пусто — будет нарисована стандартная медалька
                  </p>
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAssetUpload('logo', f);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Signature */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Подпись преподавателя (PNG с прозрачным фоном)
              </label>
              {settings.signaturePath ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={settings.signaturePath}
                    alt="Подпись"
                    className="h-14 w-auto bg-white rounded p-1 border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {settings.signaturePath.split('/').pop()}
                    </p>
                    <p className="text-xs text-gray-500">Загружено</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssetDelete('signature')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => sigInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-primary-500 rounded-lg p-6 text-center transition-colors"
                >
                  <PenTool className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">
                    Загрузить подпись
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Подпись на бумаге → отсканировать или сфотать на белом фоне → удалить фон в фото-редакторе
                  </p>
                </button>
              )}
              <input
                ref={sigInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAssetUpload('signature', f);
                  e.target.value = '';
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя преподавателя (под подписью)
              </label>
              <input
                type="text"
                value={settings.instructorName ?? ''}
                onChange={(e) => update({ instructorName: e.target.value })}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Например: Айгуль Назарова"
              />
            </div>
          </section>

          {/* Тексты */}
          <section className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Тексты на сертификате
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Заголовок
                </label>
                <input
                  type="text"
                  value={settings.titleText}
                  onChange={(e) => update({ titleText: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подзаголовок
                </label>
                <input
                  type="text"
                  value={settings.subtitleText}
                  onChange={(e) => update({ subtitleText: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Перед именем
                </label>
                <input
                  type="text"
                  value={settings.introText}
                  onChange={(e) => update({ introText: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Перед курсом
                </label>
                <input
                  type="text"
                  value={settings.completedText}
                  onChange={(e) => update({ completedText: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </section>

          {/* QR */}
          <section className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.qrEnabled}
                onChange={(e) => update({ qrEnabled: e.target.checked })}
                className="w-6 h-6 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <QrCode className="w-5 h-5 text-primary-600" />
                  <span className="font-bold text-gray-900">
                    QR-код с верификацией
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  На сертификате будет QR со ссылкой вида{' '}
                  <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                    /cert/verify/&#123;id&#125;
                  </code>{' '}
                  — любой может отсканировать и убедиться, что сертификат
                  настоящий.
                </p>
              </div>
            </label>
          </section>
        </div>

        {/* Правая колонка — превью */}
        <aside className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Превью
              <span className="text-xs font-normal text-gray-500 ml-auto">
                Обновляется при сохранении
              </span>
            </h2>
            <div className="aspect-[842/595] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <iframe
                key={previewBust}
                src={previewUrl}
                className="w-full h-full"
                title="Превью сертификата"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Образец: Анна Иванова, Brow Master Pro, № PREVIEW-DEMO
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
