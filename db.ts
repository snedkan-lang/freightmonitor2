import { NextRequest, NextResponse } from 'next/server'
import { getDb, dbAll } from '@/lib/db'
import { getGprData, getCarrierData, getNutsFlows, runFullPipeline } from '@/lib/data-scrapers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const type = new URL(req.url).searchParams.get('type') ?? 'summary'

  switch (type) {
    case 'summary':
      return NextResponse.json({ data: {
        road_tkm_mld:312.4, road_tkm_delta:4.2, rail_tkm_mld:54.8, rail_tkm_delta:1.9,
        ports_mln_t:92.1, ports_delta:-2.1, intermodal_teu_tys:1182, intermodal_delta:9.7,
        modal_split_road_pct:82.3, modal_split_rail_pct:14.8,
        gpr_year:2025, gpr_odcinki:2402, gpr_km:18249, updated_at:new Date().toISOString(),
      }, meta: { source:'UTK+GDDKiA+Eurostat', updated_at:new Date().toISOString() } })

    case 'gpr': {
      const year = parseInt(new URL(req.url).searchParams.get('year') ?? '2025')
      const data = await getGprData(year)
      return NextResponse.json({ data, meta: { source:'GDDKiA GPR', year } })
    }

    case 'carriers': {
      const year = parseInt(new URL(req.url).searchParams.get('year') ?? '2024')
      const data = await getCarrierData(year)
      return NextResponse.json({ data, meta: { source:'UTK', year } })
    }

    case 'nuts': {
      const sp = new URL(req.url).searchParams
      const year = parseInt(sp.get('year') ?? '2024')
      const mode = sp.get('mode') ?? undefined
      const data = await getNutsFlows(year, mode)
      return NextResponse.json({ data, meta: { source:'GUS BDL + Eurostat', year } })
    }

    case 'utk': {
      const rok = parseInt(new URL(req.url).searchParams.get('rok') ?? String(new Date().getFullYear()-1))
      const db = await getDb()
      const data = dbAll(db, 'SELECT * FROM utk_monthly WHERE rok=? ORDER BY miesiac,operator', [rok])
      return NextResponse.json({ data, meta: { source:'UTK', rok } })
    }

    case 'eu-ranking':
      return NextResponse.json({ data: [
        { rank:1, country:'DE', name:'Niemcy',    flag:'🇩🇪', tkm:510.2, delta: 2.1, share:21.4 },
        { rank:2, country:'PL', name:'Polska',    flag:'🇵🇱', tkm:312.4, delta: 4.2, share:13.1 },
        { rank:3, country:'ES', name:'Hiszpania', flag:'🇪🇸', tkm:248.7, delta: 1.8, share:10.4 },
        { rank:4, country:'IT', name:'Włochy',    flag:'🇮🇹', tkm:168.4, delta:-1.2, share: 7.1 },
        { rank:5, country:'FR', name:'Francja',   flag:'🇫🇷', tkm:207.3, delta:-0.9, share: 8.7 },
        { rank:6, country:'RO', name:'Rumunia',   flag:'🇷🇴', tkm:152.1, delta: 6.4, share: 6.4 },
        { rank:7, country:'NL', name:'Holandia',  flag:'🇳🇱', tkm:118.6, delta: 0.3, share: 5.0 },
        { rank:8, country:'CZ', name:'Czechy',    flag:'🇨🇿', tkm: 87.4, delta: 2.9, share: 3.7 },
        { rank:9, country:'SK', name:'Słowacja',  flag:'🇸🇰', tkm: 74.2, delta: 1.4, share: 3.1 },
        { rank:10,country:'HU', name:'Węgry',     flag:'🇭🇺', tkm: 68.1, delta: 3.2, share: 2.9 },
      ], meta: { source:'Eurostat road_go_ta_tott', year:2024 } })

    case 'ports':
      return NextResponse.json({ data: [
        { port:'Antwerpen-Brügge', country:'BE', teu_mln:12.4, bulk_mln_t: 73.2 },
        { port:'Rotterdam',        country:'NL', teu_mln:14.8, bulk_mln_t: 84.5 },
        { port:'Hamburg',          country:'DE', teu_mln: 8.9, bulk_mln_t: 42.1 },
        { port:'Algeciras',        country:'ES', teu_mln: 5.9, bulk_mln_t: 22.8 },
        { port:'Valencia',         country:'ES', teu_mln: 5.2, bulk_mln_t: 31.1 },
        { port:'Piraeus',          country:'GR', teu_mln: 4.9, bulk_mln_t: 24.5 },
        { port:'Bremerhaven',      country:'DE', teu_mln: 4.8, bulk_mln_t:  6.2 },
        { port:'Barcelona',        country:'ES', teu_mln: 3.8, bulk_mln_t: 28.4 },
        { port:'Le Havre',         country:'FR', teu_mln: 2.9, bulk_mln_t: 37.4 },
        { port:'Gdańsk DCT',       country:'PL', teu_mln: 2.1, bulk_mln_t: 48.7 },
        { port:'Koper',            country:'SI', teu_mln: 1.1, bulk_mln_t: 18.9 },
        { port:'Constanta',        country:'RO', teu_mln: 1.2, bulk_mln_t: 38.2 },
        { port:'Gdynia BCT',       country:'PL', teu_mln: 0.95,bulk_mln_t: 28.9 },
        { port:'Szczecin',         country:'PL', teu_mln: 0.11,bulk_mln_t: 14.5 },
      ], meta: { source:'Eurostat mar_go_aa + ZMPSiŚ', year:2024 } })

    default:
      return NextResponse.json({ error:'Unknown type' }, { status:400 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}) as Record<string,string>)
  if (body.action === 'run-pipeline') {
    const results = await runFullPipeline()
    return NextResponse.json({ ok:true, results })
  }
  return NextResponse.json({ error:'Unknown action' }, { status:400 })
}
