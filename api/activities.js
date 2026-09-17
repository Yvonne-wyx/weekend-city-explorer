import pg from 'pg'

const { Pool } = pg
let pool

function database() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL })
  return pool
}

const typeMap = { EXHIBITION: '展览', MARKET: '市集', PERFORMANCE: '演出', HIKE: '徒步' }
const iconMap = { EXHIBITION: '▣', MARKET: '✦', PERFORMANCE: '♫', HIKE: '◎' }

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' })
  try {
    const { rows } = await database().query(`
      SELECT ROW_NUMBER() OVER (ORDER BY a."startAt", a.title)::int AS id,
             a.title, a.type, a.price, a."startAt", a."weatherFit", a.tags,
             v.district, v.latitude, v.longitude
      FROM "Activity" a
      JOIN "Venue" v ON v.id = a."venueId"
      WHERE a.status = 'PUBLISHED'
      ORDER BY a."startAt", a.title
    `)
    return response.status(200).json(rows.map((activity) => ({
      id: activity.id,
      title: activity.title,
      type: typeMap[activity.type],
      price: Number(activity.price),
      time: new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }).format(new Date(activity.startAt)),
      district: activity.district,
      lat: Number(activity.latitude),
      lng: Number(activity.longitude),
      icon: iconMap[activity.type],
      team: '可发起出发局',
      tag: activity.weatherFit || activity.tags?.[1] || '周末推荐'
    })))
  } catch (error) {
    console.error('Unable to load activities', error)
    return response.status(500).json({ error: 'Unable to load activities' })
  }
}
