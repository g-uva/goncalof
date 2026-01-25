import path from 'node:path'
import { fileURLToPath } from 'node:url'

import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})

// GitHub Pages serves your site under /<repo>/
// In Actions, GITHUB_REPOSITORY is like "g-uva/goncalof"
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const basePath = isGitHubActions && repoName ? `/${repoName}` : ''

export default withBundleAnalyzer({
  staticPageGenerationTimeout: 300,

  // This is the big one: makes Next produce a static export in /out
  output: 'export',

  // Helps GitHub Pages not 404 on routes
  trailingSlash: true,

  // Makes asset URLs work under /<repo>/
  basePath,
  assetPrefix: basePath ? `${basePath}/` : '',

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.notion.so' },
      { protocol: 'https', hostname: 'notion.so' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com' }
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // GitHub Pages has no Next.js Image Optimization API, so disable it.
    unoptimized: true
  },

  webpack: (config) => {
    const dirname = path.dirname(fileURLToPath(import.meta.url))
    config.resolve.alias.react = path.resolve(dirname, 'node_modules/react')
    config.resolve.alias['react-dom'] = path.resolve(dirname, 'node_modules/react-dom')
    return config
  },

  transpilePackages: ['react-tweet']
})
