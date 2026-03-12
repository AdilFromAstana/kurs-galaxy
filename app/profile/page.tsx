'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Award, TrendingUp, Download, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { usePurchase } from '@/hooks/usePurchase';
import Header from '@/components/layout/Header';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  // По умолчанию показываем первый курс
  const [courseId] = useState('brow-master-pro');
  const { getProgressPercentage, getCompletedCount, getTotalCount, isFullyCompleted } = useProgress(courseId);
  const { isPurchased } = usePurchase(courseId);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const percentage = getProgressPercentage();
  const completed = getCompletedCount();
  const total = getTotalCount();
  const canDownloadCertificate = isFullyCompleted();

  const handleDownloadCertificate = () => {
    // Имитация скачивания сертификата
    alert(`🎉 Поздравляем, ${user.name}!\n\nВаш сертификат о прохождении курса "Brow Master Pro" готов к загрузке.\n\nВ реальном приложении здесь был бы PDF файл с вашим именем и датой завершения.`);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen page-wrapper">
        <div className="container-custom max-w-4xl">
          {/* Page Title */}
          <div className="mb-6 md:mb-8 animate-fade-in">
            <h1 className="mb-2">Профиль</h1>
            <p className="text-lg md:text-xl text-dark-600">
              Ваши достижения и прогресс
            </p>
          </div>

          {/* User Info Card */}
          <div className="card card-hover mb-6 animate-slide-up">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-dark-900 mb-1">
                  {user.name}
                </h2>
                <p className="text-sm md:text-base text-dark-600 mb-2">
                  {user.email}
                </p>
                <div className="flex items-center gap-2">
                  {isPurchased ? (
                    <span className="badge bg-primary-100 text-primary-700">
                      ✨ Полный доступ
                    </span>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-600">
                      Бесплатный доступ
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Progress */}
            <div className="card card-hover animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-dark-600 mb-1">Прогресс</p>
                  <p className="text-2xl md:text-3xl font-bold text-dark-900">{percentage}%</p>
                </div>
              </div>
            </div>

            {/* Completed Lessons */}
            <div className="card card-hover animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-dark-600 mb-1">Завершено</p>
                  <p className="text-2xl md:text-3xl font-bold text-dark-900">
                    {completed}/{total}
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Status */}
            <div className="card card-hover animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  canDownloadCertificate ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  <Award className={`w-6 h-6 ${
                    canDownloadCertificate ? 'text-yellow-600' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-dark-600 mb-1">Сертификат</p>
                  <p className="text-base md:text-lg font-bold text-dark-900">
                    {canDownloadCertificate ? 'Доступен' : 'Недоступен'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Section */}
          <div className={`card animate-slide-up ${
            canDownloadCertificate 
              ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200' 
              : 'bg-gray-50'
          }`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center ${
                  canDownloadCertificate 
                    ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' 
                    : 'bg-gray-200'
                }`}>
                  {canDownloadCertificate ? (
                    <Award className="w-12 h-12 md:w-14 md:h-14 text-white" />
                  ) : (
                    <Lock className="w-12 h-12 md:w-14 md:h-14 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold text-dark-900 mb-2">
                  {canDownloadCertificate ? 'Ваш сертификат готов! 🎉' : 'Сертификат о прохождении курса'}
                </h2>
                <p className="text-sm md:text-base text-dark-600 mb-4">
                    {canDownloadCertificate
                      ? 'Поздравляем! Вы успешно завершили курс "Brow Master Pro". Скачайте свой именной сертификат.'
                      : `Завершите все уроки курса (${completed}/${total}), чтобы получить именной сертификат.`}
                  </p>

                {canDownloadCertificate ? (
                  <button
                    onClick={handleDownloadCertificate}
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Скачать сертификат PDF
                  </button>
                ) : (
                  <div className="inline-block">
                    <div className="progress-bar w-64">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs md:text-sm text-dark-500 mt-2">
                      Осталось пройти: {total - completed} {total - completed === 1 ? 'урок' : 'уроков'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {canDownloadCertificate && (
            <div className="mt-6 p-4 md:p-6 bg-white rounded-2xl border border-gray-200 text-center animate-slide-up">
              <p className="text-sm md:text-base text-dark-600">
                🌟 Поделитесь своим достижением в социальных сетях!
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
