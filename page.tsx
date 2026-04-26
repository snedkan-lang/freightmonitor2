import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllNews } from '@/lib/news-scraper'
import { runFullPipeline } from '@/lib/data-scrapers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET ?? 'freightmonitor-dev'
  if (secret !== cronSecret) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  const started = Date.now()
  const results: { task:string; records?:number; errors?:string[]; ms:number }[] = []

  try {
    const t = Date.now()
    const { total, errors } = await scrapeAllNews()
    results.push({ task:'news', records:total, errors, ms:Date.now()-t })
  } catch(e) { results.push({ task:'news', errors:[String(e)], ms:0 }) }

  try {
    const t = Date.now()
    const pipeResults = await runFullPipeline()
    results.push({ task:'pipeline', records:pipeResults.reduce((s,r)=>s+r.records,0),
      errors:pipeResults.filter(r=>r.error).map(r=>`${r.source}: ${r.error}`), ms:Date.now()-t })
  } catch(e) { results.push({ task:'pipeline', errors:[String(e)], ms:0 }) }

  return NextResponse.json({ ok:true, duration_ms:Date.now()-started, ran_at:new Date().toISOString(), results })
}
