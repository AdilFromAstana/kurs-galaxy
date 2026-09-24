/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Для прод-образа: .next/standalone содержит мини-сервер
  // с нужными node_modules. На dev никак не влияет.
  output: 'standalone',
  // Загруженные после старта картинки Next статикой не видит — такие
  // запросы уходят в app/api/public-files, который читает файл с диска.
  // Массив = afterFiles: срабатывает только если файла нет в /public.
  async rewrites() {
    return [
      {
        source: '/:dir(lesson-photos|course-thumbnails|lesson-covers|certificate-assets)/:file',
        destination: '/api/public-files/:dir/:file',
      },
    ];
  },
}

module.exports = nextConfig
