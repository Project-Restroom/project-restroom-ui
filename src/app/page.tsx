'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f1f5f9', color: '#64748b', fontSize: 18,
    }}>
      Loading map…
    </div>
  ),
})

export default function Home() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister())
      }).then(() => {
        navigator.serviceWorker.register('/sw.js')
      }).catch(() => {})
    }
  }, [])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '12px 16px',
        background: '#2563eb',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Project Restroom</h1>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Community Restroom Reviews</span>
      </header>
      <main style={{ flex: 1, position: 'relative' }}>
        <MapView />
      </main>
    </div>
  )
}
