import type { Review } from '@/lib/types'
import { ratingColor } from '@/lib/types'

export default function ReviewCard({ review }: { review: Review }) {
  const color = ratingColor(review.rating)

  return (
    <div style={{
      padding: '8px 10px',
      borderRadius: 6,
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      fontSize: 13,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: '#334155' }}>{review.restroom_type}</span>
        <span style={{
          background: color,
          color: 'white',
          padding: '1px 8px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
        }}>
          {review.rating}
        </span>
      </div>
      <p style={{ margin: '0 0 4px', color: '#475569', lineHeight: 1.4 }}>
        {review.notes}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
        <span>{review.date}</span>
        {review.youtube_url && (
          <a href={review.youtube_url} target="_blank" rel="noopener noreferrer"
             style={{ color: '#2563eb', textDecoration: 'none' }}>
            Watch review →
          </a>
        )}
      </div>
    </div>
  )
}
