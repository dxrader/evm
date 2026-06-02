/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  turbopack: {
    resolveAlias: {
      // Stub out Coinbase's optional 'accounts' dep used by wagmi tempoWallet connector
      accounts: './stubs/accounts.js',
    },
  },
}

export default nextConfig
