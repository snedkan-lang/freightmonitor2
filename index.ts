import { NextRequest, NextResponse } from 'next/server'
import { getNews, scrapeAllNews } from '@/lib/news-scraper'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const sourceKey = sp.get('source') ?? undefined
  const category  = sp.get('category') ?? undefined
  const limit     = parseInt(sp.get('limit') ?? '50')
  const refresh   = sp.get('refresh') === '1'

  if (refresh) await scrapeAllNews()
  const news = await getNews({ sourceKey, category, limit })

  return NextResponse.json({ data: news, meta: {
    count: news.length, cached: !refresh, updated_at: new Date().toISOString(),
  }})
}

export async function POST() {
  const result = await scrapeAllNews()
  return NextResponse.json({ ok: true, ...result })
}
