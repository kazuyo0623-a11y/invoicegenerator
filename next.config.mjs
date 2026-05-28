/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // better-sqlite3 is a native module, only for server
      config.externals = [...(config.externals || []), 'better-sqlite3']
    }
    return config
  },
}

export default nextConfig
