import Link from 'next/link';
import { CheckCircle2, XCircle, BookOpen, User, Calendar, Award } from 'lucide-react';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

function formatDateRu(date: Date): string {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} г.`;
}

export default async function CertificateVerifyPage({ params }: Props) {
  const cert = await prisma.certificate.findUnique({
    where: { id: params.id },
  });

  const settings = await prisma.certificateSettings.findUnique({
    where: { id: 'default' },
  });
  const brandName = settings?.brandName ?? 'KursGalaxy.kz';

  if (!cert) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center border border-red-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Сертификат не найден
          </h1>
          <p className="text-gray-600 mb-2">
            Сертификата с номером
          </p>
          <p className="font-mono text-sm bg-gray-100 rounded-lg py-2 px-3 inline-block mb-4">
            {params.id}
          </p>
          <p className="text-gray-600 mb-6">
            не существует. Возможно, ID указан с ошибкой.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-green-50 via-white to-primary-50">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Шапка с подтверждением */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 md:p-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Сертификат подлинный
          </h1>
          <p className="text-white/90 text-sm md:text-base">
            Этот документ выдан академией {brandName} и зафиксирован в системе
          </p>
        </div>

        {/* Данные */}
        <div className="p-6 md:p-8 space-y-4">
          <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                Владелец
              </p>
              <p className="text-lg font-bold text-gray-900 break-words">
                {cert.userName}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                Курс
              </p>
              <p className="text-base font-semibold text-gray-900 break-words">
                {cert.courseTitle}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                Дата выдачи
              </p>
              <p className="text-base font-semibold text-gray-900">
                {formatDateRu(cert.issuedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                Номер сертификата
              </p>
              <p className="font-mono text-sm bg-gray-100 inline-block rounded px-2 py-1">
                {cert.id}
              </p>
            </div>
          </div>
        </div>

        {/* Футер */}
        <div className="bg-gray-50 px-6 md:px-8 py-4 text-center border-t border-gray-100">
          <Link
            href="/"
            className="inline-block text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {brandName} →
          </Link>
        </div>
      </div>
    </div>
  );
}
