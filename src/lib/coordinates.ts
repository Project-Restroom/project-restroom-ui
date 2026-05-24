import type { Establishment, EstablishmentWithCoords } from '@/lib/types'

const GITHUB_URL =
  'https://raw.githubusercontent.com/Project-Restroom/project-restroom/refs/heads/main/_data/reviews.json'

const OSM_API = 'https://api.openstreetmap.org/api/0.6'
const NOMINATIM = 'https://nominatim.openstreetmap.org'

type Coord = { lat: number; lon: number }

async function tryOsmApi(id: number, type: 'node' | 'way' | 'relation'): Promise<Coord | null> {
  const res = await fetch(`${OSM_API}/${type}/${id}.json`)
  if (!res.ok) return null
  let data: any
  try { data = await res.json() } catch { return null }
  const el = data.elements?.[0]
  if (!el) return null
  if (type === 'node') return { lat: el.lat, lon: el.lon }
  if (type === 'way' && el.nodes?.length) {
    const nodesRes = await fetch(`${OSM_API}/nodes?nodes=${el.nodes.join(',')}`)
    if (!nodesRes.ok) return null
    let nodesData: any
    try { nodesData = await nodesRes.json() } catch { return null }
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
): Promise<{ lat: number; lon: number; osm_type: 'node' | 'way' | 'relation' } | null> {
  const types = knownType ? [knownType] : (['node', 'way', 'relation'] as const)
  for (const t of types) {
    const r = await tryOsmApi(id, t)
    if (r) return { ...r, osm_type: t }
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
  let data: any
  try { data = await res.json() } catch { return null }
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

export async function fetchEstablishments(): Promise<EstablishmentWithCoords[]> {
  const res = await fetch(GITHUB_URL)
  if (!res.ok) throw new Error('Failed to fetch reviews.json from GitHub')
  let data: Establishment[]
  try { data = await res.json() } catch { throw new Error('Invalid JSON from GitHub') }
  const results: EstablishmentWithCoords[] = []
  for (const e of data) {
    if (e.osm_id) {
      const osm = await resolveByOsmId(e.osm_id)
      if (osm) {
        results.push({ ...e, lat: osm.lat, lon: osm.lon, osm_type: osm.osm_type })
        continue
      }
    }
    const geo = await geocode(e.establishment, e.city, e.state)
    if (geo) {
      results.push({ ...e, ...geo })
      continue
    }
    console.warn(`Could not resolve coordinates for ${e.establishment}`)
  }
  return results
}
