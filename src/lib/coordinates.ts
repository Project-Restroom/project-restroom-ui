import type { Establishment, EstablishmentWithCoords } from '@/lib/types'
import reviewsData from '@/data/reviews.json'

const OSM_API = 'https://api.openstreetmap.org/api/0.6'
const NOMINATIM = 'https://nominatim.openstreetmap.org'

type Coord = { lat: number; lon: number }

const preResolved: Record<string, Coord> = {
  "Tabitha's House": { lat: 39.4187, lon: -76.2944 },
  'Grocery Bargain Outlet': { lat: 39.4343, lon: -76.3158 },
  'Edgewood Prime Thrift': { lat: 39.4348, lon: -76.3126 },
  "Mom's Organic Market": { lat: 39.3677, lon: -76.4533 },
  'Petco': { lat: 39.3678, lon: -76.4535 },
}

const osmTypes: Record<string, 'node' | 'way' | 'relation'> = {
  'Edgewood Prime Thrift': 'way',
}

const raw = reviewsData as Establishment[]

export const establishments: EstablishmentWithCoords[] = (() => {
  const result: EstablishmentWithCoords[] = []
  for (const e of raw) {
    const c = preResolved[e.establishment]
    if (c) result.push({ ...e, ...c, osm_type: osmTypes[e.establishment] })
  }
  return result
})()

async function tryOsmApi(id: number, type: 'node' | 'way' | 'relation'): Promise<Coord | null> {
  const res = await fetch(`${OSM_API}/${type}/${id}.json`)
  if (!res.ok) return null
  const data = await res.json()
  const el = data.elements?.[0]
  if (!el) return null
  if (type === 'node') return { lat: el.lat, lon: el.lon }
  if (type === 'way' && el.nodes?.length) {
    const nodesRes = await fetch(`${OSM_API}/nodes?nodes=${el.nodes.join(',')}`)
    if (!nodesRes.ok) return null
    const nodesData = await nodesRes.json()
    const nodes = nodesData.elements?.filter((n: any) => n.lat != null)
    if (!nodes?.length) return null
    return {
      lat: nodes.reduce((s: number, n: any) => s + n.lat, 0) / nodes.length,
      lon: nodes.reduce((s: number, n: any) => s + n.lon, 0) / nodes.length,
    }
  }
  return null
}

async function resolveByOsmId(
  id: number,
  knownType?: 'node' | 'way' | 'relation'
): Promise<Coord | null> {
  const types = knownType ? [knownType] : (['node', 'way', 'relation'] as const)
  for (const t of types) {
    const r = await tryOsmApi(id, t)
    if (r) return r
  }
  return null
}

async function geocode(name: string, city: string, state: string): Promise<Coord | null> {
  const q = `${name}, ${city}, ${state}`
  const res = await fetch(
    `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
    { headers: { 'User-Agent': 'ProjectRestroomWeb/1.0' } }
  )
  if (!res.ok) return null
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

export async function resolveEstablishment(
  e: Establishment
): Promise<EstablishmentWithCoords> {
  const pre = preResolved[e.establishment]
  if (pre) return { ...e, ...pre, osm_type: osmTypes[e.establishment] }
  if (e.osm_id) {
    const osm = await resolveByOsmId(e.osm_id, osmTypes[e.establishment])
    if (osm) return { ...e, ...osm, osm_type: osmTypes[e.establishment] }
  }
  const geo = await geocode(e.establishment, e.city, e.state)
  if (geo) return { ...e, ...geo }
  throw new Error(`Could not resolve coordinates for ${e.establishment}`)
}

export async function getAllEstablishments(): Promise<EstablishmentWithCoords[]> {
  const results: EstablishmentWithCoords[] = []
  for (const e of raw) {
    try {
      results.push(await resolveEstablishment(e))
    } catch {
      console.warn(`Skipping ${e.establishment}: unable to resolve`)
    }
  }
  return results
}


