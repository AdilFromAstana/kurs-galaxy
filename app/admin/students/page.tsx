'use client';

import { Users, AlertCircle, Database, User, Mail, Calendar, Award, TrendingUp } from 'lucide-react';

export default function StudentsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-8 h-8 text-orange-600" />
          Студенты
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Управление студентами курса
        </p>
      </div>

      {/* Информационный блок */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-blue-900 mb-2">
              Backend требуется для управления студентами
            </h2>
            <p className="text-blue-800 mb-4">
              Текущая версия приложения использует localStorage для хранения данных. 
              Для полноценного управления студентами необходимо подключить backend API.
            </p>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">Что потребуется:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  База данных для хранения информации о студентах
                </li>
                <li className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  API endpoints для управления пользователями
                </li>
                <li className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  Система аутентификации (JWT tokens)
                </li>
                <li className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  Хранение прогресса студентов на сервере
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Макет интерфейса */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Предварительный дизайн интерфейса
        </h2>
        <p className="text-gray-600 mb-6">
          Так будет выглядеть таблица студентов после подключения backend:
        </p>

        {/* Mock таблица */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Студент
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Регистрация
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Прогресс
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Статус
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Mock данные */}
              <tr className="border-b border-gray-100 opacity-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold">А</span>
                    </div>
                    <span className="font-medium text-gray-900">Анна Иванова</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-600">anna@example.com</td>
                <td className="py-4 px-4 text-gray-600">15.02.2024</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">75%</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Куплено
                  </span>
                </td>
              </tr>

              <tr className="border-b border-gray-100 opacity-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-semibold">М</span>
                    </div>
                    <span className="font-medium text-gray-900">Мария Петрова</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-600">maria@example.com</td>
                <td className="py-4 px-4 text-gray-600">20.02.2024</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">30%</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Куплено
                  </span>
                </td>
              </tr>

              <tr className="border-b border-gray-100 opacity-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-700 font-semibold">Е</span>
                    </div>
                    <span className="font-medium text-gray-900">Елена Смирнова</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-600">elena@example.com</td>
                <td className="py-4 px-4 text-gray-600">25.02.2024</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">10%</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    Бесплатно
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm text-gray-500 mt-4 text-center italic">
          * Это демонстрация интерфейса. Реальные данные будут отображаться после подключения backend.
        </p>
      </div>

      {/* Функции, которые будут доступны */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Планируемый функционал
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">👥 Управление студентами</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Просмотр списка всех студентов</li>
              <li>• Поиск и фильтрация</li>
              <li>• Детальная информация о каждом</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📊 Статистика прогресса</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Отслеживание прогресса</li>
              <li>• Завершенные уроки</li>
              <li>• Время обучения</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">💳 Управление покупками</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Информация о платежах</li>
              <li>• Предоставление доступа</li>
              <li>• История транзакций</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📧 Коммуникация</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Отправка уведомлений</li>
              <li>• Email рассылки</li>
              <li>• Персональные сообщения</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Следующие шаги */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
        <h2 className="text-lg font-bold text-orange-900 mb-4">
          🚀 Следующие шаги для реализации
        </h2>
        <ol className="space-y-3 text-orange-900">
          <li className="flex gap-3">
            <span className="font-bold flex-shrink-0">1.</span>
            <span>Выбрать и настроить backend (Node.js/Express, Django, Laravel и т.д.)</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold flex-shrink-0">2.</span>
            <span>Создать базу данных (PostgreSQL, MySQL, MongoDB)</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold flex-shrink-0">3.</span>
            <span>Разработать API endpoints для управления пользователями</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold flex-shrink-0">4.</span>
            <span>Интегрировать систему аутентификации</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold flex-shrink-0">5.</span>
            <span>Реализовать интерфейс управления студентами</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
