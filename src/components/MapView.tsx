'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { EstablishmentWithCoords } from '@/lib/types'
import { avgRating, ratingColor } from '@/lib/types'
import { establishments } from '@/lib/coordinates'
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
}: {
  data: EstablishmentWithCoords[]
  userPos: [number, number] | null
}) {
  const map = useMap()
  useEffect(() => {
    if (userPos) {
      map.setView(userPos, 13)
    } else if (data.length > 1) {
      map.fitBounds(data.map((e) => [e.lat, e.lon]), { padding: [50, 50] })
    } else if (data.length === 1) {
      map.setView([data[0].lat, data[0].lon], 14)
    }
  }, [data, userPos, map])
  return null
}

export default function MapView() {
  const [userPos, setUserPos] = useState<[number, number] | null>(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, maximumAge: 10000 }
    )
  }, [])

  return (
    <MapContainer
      center={[39.4187, -76.2944]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://openmaptiles.org/">OpenMapTiles</a>'
        url="https://tiles.liberty-rider.com/styles/osm-liberty/{z}/{x}/{y}.png"
      />
      <FitBounds data={establishments} userPos={userPos} />
      {userPos && <Marker position={userPos} icon={createUserIcon()} />}
      {establishments.map((e) => (
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
    </MapContainer>
  )
}
