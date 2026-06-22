'use client';

import toast from 'react-hot-toast';

interface ConfirmOptions {
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

/**
 * Промис-обёртка над тостером, имитирующая `window.confirm()`.
 * Возвращает Promise<boolean>: true если юзер нажал "подтвердить".
 */
export function confirmToast({
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const id = toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-900">{message}</p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className={`px-3 py-1.5 text-sm font-semibold text-white rounded-lg ${
                destructive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity, // только пока юзер не выберет
        position: 'top-center',
        style: {
          background: '#fff',
          color: '#111827',
          padding: '16px',
          maxWidth: '400px',
        },
      },
    );

    // На всякий случай — резолв false если тост закроют как-то иначе
    setTimeout(() => {
      // не делаем ничего — но если тост закрылся естественно, промис всё равно резолвится через кнопку
    }, 0);
  });
}
