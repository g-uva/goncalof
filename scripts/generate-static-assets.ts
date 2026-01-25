import { promises as fs } from 'node:fs'
import path from 'node:path'

import {
  getBlockParentPage,
  getBlockTitle,
  getPageProperty,
  idToUuid
} from 'notion-utils'
import RSS from 'rss'

import * as config from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { getSocialImageUrl } from '@/lib/get-social-image-url'
import { getCanonicalPageUrl } from '@/lib/map-page-url'

const OUTPUT_DIR = path.join(process.cwd(), 'public')

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
}

async function writeRobots() {
  const robots = `User-agent: *
Allow: /
Disallow: /api/get-tweet-ast/*
Disallow: /api/search-notion

Sitemap: ${config.host}/sitemap.xml
`

  await fs.writeFile(path.join(OUTPUT_DIR, 'robots.txt'), robots, 'utf8')
}

async function writeSitemap(siteMap: Awaited<ReturnType<typeof getSiteMap>>) {
  const urls = Object.keys(siteMap.canonicalPageMap)
    .map((canonicalPagePath) => {
      const slug = canonicalPagePath.endsWith('/')
        ? canonicalPagePath
        : `${canonicalPagePath}/`
      return `    <url>
      <loc>${config.host}/${slug}</loc>
    </url>`
    })
    .join('\n\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.host}</loc>
  </url>

  <url>
    <loc>${config.host}/</loc>
  </url>

${urls}
</urlset>
`

  await fs.writeFile(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap, 'utf8')
}

async function writeFeed(siteMap: Awaited<ReturnType<typeof getSiteMap>>) {
  const ttlMinutes = 24 * 60 // 24 hours

  const feed = new RSS({
    title: config.name,
    site_url: config.host,
    feed_url: `${config.host}/feed.xml`,
    language: config.language,
    ttl: ttlMinutes
  })

  for (const pagePath of Object.keys(siteMap.canonicalPageMap)) {
    const pageId = siteMap.canonicalPageMap[pagePath]!
    const recordMap = siteMap.pageMap[pageId]
    if (!recordMap) continue

    const keys = Object.keys(recordMap?.block || {})
    const block = recordMap?.block?.[keys[0]!]?.value
    if (!block) continue

    const parentPage = getBlockParentPage(block, recordMap)
    const isBlogPost =
      block.type === 'page' &&
      block.parent_table === 'collection' &&
      parentPage?.id === idToUuid(config.rootNotionPageId)
    if (!isBlogPost) {
      continue
    }

    const title = getBlockTitle(block, recordMap) || config.name
    const description =
      getPageProperty<string>('Description', block, recordMap) ||
      config.description
    const url = getCanonicalPageUrl(config.site, recordMap)(pageId)
    const lastUpdatedTime = getPageProperty<number>(
      'Last Updated',
      block,
      recordMap
    )
    const publishedTime = getPageProperty<number>(
      'Published',
      block,
      recordMap
    )
    const date = lastUpdatedTime
      ? new Date(lastUpdatedTime)
      : publishedTime
        ? new Date(publishedTime)
        : new Date()
    const socialImageUrl = getSocialImageUrl(pageId)

    feed.item({
      title,
      url,
      date,
      description,
      enclosure: socialImageUrl
        ? {
            url: socialImageUrl,
            type: 'image/jpeg'
          }
        : undefined
    })
  }

  const feedText = feed.xml({ indent: true })
  await fs.writeFile(path.join(OUTPUT_DIR, 'feed.xml'), feedText, 'utf8')
}

async function main() {
  await ensureOutputDir()
  const siteMap = await getSiteMap()

  await Promise.all([writeRobots(), writeSitemap(siteMap), writeFeed(siteMap)])
  console.log('Generated robots.txt, sitemap.xml, and feed.xml in /public')
}

main().catch((err) => {
  console.error('Failed to generate static assets', err)
  process.exit(1)
})
