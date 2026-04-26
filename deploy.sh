import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FreightMonitor — Transport Intelligence Platform',
  description: 'Analityka transportu drogowego, kolejowego i morskiego w Polsce i Europie. GPR 2025, UTK, Eurostat, PKP PLK.',
  keywords: ['transport', 'freight', 'kolej', 'GPR 2025', 'UTK', 'intermodal', 'eFTI', 'logistics'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
