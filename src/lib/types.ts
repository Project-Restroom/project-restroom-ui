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
