import 'dotenv/config'
import pg from 'pg'
import { randomUUID } from 'node:crypto'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const activities = [
  ['西岸艺术季·夜场', 'EXHIBITION', 60, '徐汇滨江', '西岸美术馆', '龙腾大道2600号', 31.183, 121.448, '室内外，适合晴朗傍晚'],
  ['大学路周末创意市集', 'MARKET', 0, '五角场', '大学路市集', '大学路199号', 31.301, 121.513, '独立摊主、旧书与手作'],
  ['屋顶爵士·日落场', 'PERFORMANCE', 128, '静安寺', '日落屋顶', '愚园路88号', 31.227, 121.444, '日落限定现场演出'],
  ['佘山轻徒步·森林线', 'HIKE', 45, '佘山', '佘山国家森林公园', '外青松公路9258号', 31.097, 121.191, '8km 新手友好徒步'],
  ['M50 工作室开放日', 'EXHIBITION', 35, '莫干山路', 'M50 创意园', '莫干山路50号', 31.243, 121.453, '工作室与纸本展限时开放'],
  ['永康路手作与旧书摊', 'MARKET', 0, '衡山路', '永康路', '永康路100号', 31.211, 121.452, '宠物友好，免费入场'],
  ['沪语喜剧开放麦', 'PERFORMANCE', 78, '黄浦', '外滩喜剧空间', '北京东路99号', 31.224, 121.474, '轻松社交，适合第一次结伴'],
  ['苏州河晨跑社', 'HIKE', 0, '静安', '苏州河步道', '光复路1号', 31.247, 121.454, '5km 新手友好，跑后早餐'],
  ['武康路建筑散步', 'HIKE', 20, '徐汇', '武康大楼', '淮海中路1850号', 31.205, 121.438, '含建筑讲解'],
  ['当代摄影双人展', 'EXHIBITION', 50, '浦东美术馆', '浦东美术馆', '滨江大道2777号', 31.239, 121.502, '学生票可用'],
  ['安福路夜间花市', 'MARKET', 0, '安福路', '安福路花市', '安福路200号', 31.209, 121.447, '适合约会的夜间花市'],
  ['黑胶聆听会：城市声景', 'PERFORMANCE', 88, '长乐路', '长乐聆听室', '长乐路666号', 31.222, 121.454, '室内雨天备选']
]

async function main() {
  let added = 0
  for (let index = 0; index < activities.length; index += 1) {
    const [title, type, price, district, venueName, address, latitude, longitude, description] = activities[index]
    const existing = await pool.query('SELECT id FROM "Activity" WHERE title = $1 LIMIT 1', [title])
    if (existing.rowCount) continue

    const knownVenue = await pool.query('SELECT id FROM "Venue" WHERE name = $1 AND address = $2 LIMIT 1', [venueName, address])
    const venueId = knownVenue.rows[0]?.id ?? randomUUID().replaceAll('-', '')
    if (!knownVenue.rowCount) {
      await pool.query('INSERT INTO "Venue" (id, name, address, district, latitude, longitude, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())', [venueId, venueName, address, district, latitude, longitude])
    }
    const day = 20 + (index > 7 ? 1 : 0)
    const startAt = new Date(Date.UTC(2026, 8, day, 10 + (index % 8), 0))
    const endAt = new Date(Date.UTC(2026, 8, day, 13 + (index % 8), 0))
    await pool.query('INSERT INTO "Activity" (id, title, description, type, status, price, "startAt", "endAt", capacity, "weatherFit", tags, "venueId", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4::"ActivityType",$5::"ActivityStatus",$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())', [randomUUID().replaceAll('-', ''), title, description, type, 'PUBLISHED', price, startAt, endAt, 40, index % 3 === 0 ? '晴朗' : index % 3 === 1 ? '室内优先' : '全天候', [district, price === 0 ? '免费' : '学生友好'], venueId])
    added += 1
  }
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM "Activity"')
  console.log(JSON.stringify({ newlyInsertedActivities: added, totalActivities: rows[0].count }))
}

main().finally(() => pool.end())
