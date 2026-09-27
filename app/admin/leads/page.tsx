'use client';

import { Inbox, Phone, Calendar, Check, Trash2, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Lead = {
  id: string;
  name: string;
  phone: string;
  handled: boolean;
  createdAt: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/admin/leads', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const setHandled = async (lead: Lead, handled: boolean) => {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, handled } : l)));
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handled }),
    });
    if (!res.ok) {
      toast.error('Не удалось обновить заявку');
      fetchList();
    }
  };

  const remove = async (lead: Lead) => {
    if (!window.confirm(`Удалить заявку от «${lead.name}»?`)) return;
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      toast.error('Не удалось удалить заявку');
      fetchList();
    }
  };

  const pending = leads.filter((l) => !l.handled).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Inbox className="w-8 h-8 text-primary-600" />
          Заявки
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          С формы «Остались вопросы?» на главной · новых: {pending}
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-100 shadow-soft">
          Загрузка...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-700 font-medium mb-3">Не удалось загрузить заявки</p>
          <button
            onClick={fetchList}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium"
          >
            Повторить
          </button>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
          <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Заявок пока нет</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => (
            <li
              key={l.id}
              className={`bg-white rounded-2xl border shadow-soft p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                l.handled ? 'border-gray-100 opacity-60' : 'border-primary-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{l.name}</p>
                  {!l.handled && (
                    <span className="text-[10px] font-bold uppercase bg-primary-600 text-white rounded-full px-2 py-0.5">
                      новая
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary-600">
                    <Phone className="w-4 h-4" />
                    {l.phone}
                  </a>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(l.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHandled(l, !l.handled)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                    l.handled
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {l.handled ? <RotateCcw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  {l.handled ? 'Вернуть' : 'Обработана'}
                </button>
                <button
                  onClick={() => remove(l)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  aria-label="Удалить заявку"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
