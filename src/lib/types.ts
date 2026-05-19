export interface Review {
  restroom_type: string
  youtube_url?: string
  rating: number
  date: string
  notes: string
}

export interface Establishment {
  establishment: string
  city: string
  state: string
  osm_id?: number
  reviews: Review[]
}

export interface EstablishmentWithCoords extends Establishment {
  lat: number
  lon: number
  osm_type?: 'node' | 'way' | 'relation'
}

export function avgRating(reviews: Review[]): number {
  const sum = reviews.reduce((a, r) => a + r.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

export function ratingColor(rating: number): string {
  if (rating >= 7) return '#22c55e'
  if (rating >= 4) return '#eab308'
  return '#ef4444'
}

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getDeviceContext() {
  if (typeof window === 'undefined') {
    return { isMobile: false, isStandalone: false }
  }

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    false

  let isMobile = false
  if ((navigator as any).userAgentData) {
    isMobile = (navigator as any).userAgentData.mobile
  } else {
    isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent
    )
  }

  return { isMobile, isStandalone }
}
