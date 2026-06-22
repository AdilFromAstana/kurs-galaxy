'use client';

import { Users, Search, Mail, Calendar, ShoppingBag, CheckCircle2, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Student = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  _count: { purchases: number; progress: number };
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const fetchList = async (query = '') => {
    setLoading(true);
    const url = query ? `/api/admin/students?q=${encodeURIComponent(query)}` : '/api/admin/students';
    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setStudents(data.students ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-8 h-8 text-orange-600" />
          Студенты
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Всего: {students.length}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchList(q);
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по имени или email"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Найти
        </button>
      </form>

      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 border border-gray-100">
          Загрузка...
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Студенты ещё не зарегистрированы</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Студент</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden md:table-cell">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden md:table-cell">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Регистрация
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  <ShoppingBag className="inline w-4 h-4 mr-1" />
                  Покупки
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  <CheckCircle2 className="inline w-4 h-4 mr-1" />
                  Уроков
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer group"
                  onClick={() => {
                    window.location.href = `/admin/students/${s.id}`;
                  }}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="font-medium text-gray-900 group-hover:text-primary-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {s.name}
                        </Link>
                        <p className="text-xs text-gray-500 md:hidden">
                          {s.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                    {s.email}
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                    {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="py-3 px-4 text-gray-700">{s._count.purchases}</td>
                  <td className="py-3 px-4 text-gray-700">
                    <span className="flex items-center justify-between gap-2">
                      {s._count.progress}
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
