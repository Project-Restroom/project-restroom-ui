'use client'

import { useCallback, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { EstablishmentWithCoords } from '@/lib/types'
import { avgRating, ratingColor, getDeviceContext } from '@/lib/types'
import { fetchEstablishments } from '@/lib/coordinates'
import ReviewCard from './ReviewCard'

function createMarkerIcon(rating: number) {
  const color = ratingColor(rating)
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,.3);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:12px;
    ">${Math.round(rating)}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  })
}

function createUserIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:#2563eb;border:3px solid white;
      box-shadow:0 0 0 3px rgba(37,99,235,.4);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function FitBounds({
  data,
  userPos,
  isMobile,
}: {
  data: EstablishmentWithCoords[]
  userPos: [number, number] | null
  isMobile: boolean
}) {
  const map = useMap()
  const zoom = isMobile ? 15 : 11
  useEffect(() => {
    if (userPos) {
      map.setView(userPos, zoom)
    } else if (data.length > 1) {
      map.fitBounds(data.map((e) => [e.lat, e.lon]), { padding: [50, 50], maxZoom: zoom })
    } else if (data.length === 1) {
      map.setView([data[0].lat, data[0].lon], zoom)
    }
  }, [data, userPos, zoom, map])
  return null
}

export default function MapView() {
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [data, setData] = useState<EstablishmentWithCoords[]>([])
  const [loading, setLoading] = useState(true)
  const { isMobile } = getDeviceContext()

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, maximumAge: 10000 }
    )
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const establishments = await fetchEstablishments()
      setData(establishments)
    } catch (e) {
      console.error('Failed to load establishments:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f1f5f9', color: '#64748b', fontSize: 18,
      }}>
        Loading establishments…
      </div>
    )
  }

  return (
    <MapContainer
      center={[39.2908816,-76.610759]}
      zoom={8}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://openmaptiles.org/">OpenMapTiles</a>'
        url="https://tiles.liberty-rider.com/styles/osm-liberty/{z}/{x}/{y}.png"
      />
      <FitBounds data={data} userPos={userPos} isMobile={isMobile} />
      {userPos && <Marker position={userPos} icon={createUserIcon()} />}
      {data.map((e) => (
        <Marker
          key={e.establishment}
          position={[e.lat, e.lon]}
          icon={createMarkerIcon(avgRating(e.reviews))}
        >
          <Popup maxWidth={350} minWidth={280}>
            <div style={{ minWidth: 260 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{e.establishment}</h3>
              <p style={{ margin: '0 0 8px', color: '#666', fontSize: 13 }}>
                {e.city}, {e.state}
                {e.osm_type && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#999' }}>
                    OSM {e.osm_type}
                  </span>
                )}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {e.reviews.map((r, i) => (
                  <ReviewCard key={i} review={r} />
                ))}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      <button
        onClick={load}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          width: 48,
          height: 48,
          borderRadius: 24,
          border: 'none',
          background: '#2563eb',
          color: 'white',
          fontSize: 22,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
        aria-label="Refresh data"
      >
        ↻
      </button>
    </MapContainer>
  )
}
