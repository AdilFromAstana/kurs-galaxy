/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Для прод-образа: .next/standalone содержит мини-сервер
  // с нужными node_modules. На dev никак не влияет.
  output: 'standalone',
}

module.exports = nextConfig
