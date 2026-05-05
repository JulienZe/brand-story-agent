import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', '..', 'data')

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

const db = new Database(join(DATA_DIR, 'brand-story.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    product_desc TEXT,
    template TEXT,
    target_user TEXT,
    tone TEXT,
    result TEXT NOT NULL,
    is_favorite INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_stories_is_favorite ON stories(is_favorite);

  CREATE TABLE IF NOT EXISTS workflow_states (
    id TEXT PRIMARY KEY,
    story_id TEXT,
    current_stage TEXT,
    stage_data TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
  );
`)

export function createStory(record) {
  const stmt = db.prepare(`
    INSERT INTO stories (id, product_name, product_desc, template, target_user, tone, result)
    VALUES (@id, @productName, @productDesc, @template, @targetUser, @tone, @result)
  `)
  stmt.run({
    id: record.id,
    productName: record.productName,
    productDesc: record.productDesc || '',
    template: record.template || null,
    targetUser: record.targetUser || null,
    tone: record.tone || null,
    result: JSON.stringify(record.result),
  })
  return getStory(record.id)
}

export function getStory(id) {
  const row = db.prepare('SELECT * FROM stories WHERE id = ?').get(id)
  if (!row) return null
  return formatStory(row)
}

export function getAllStories({ limit = 50, offset = 0, search, favoritesOnly } = {}) {
  let query = 'SELECT * FROM stories'
  const conditions = []
  const params = []

  if (search) {
    conditions.push('product_name LIKE ?')
    params.push(`%${search}%`)
  }
  if (favoritesOnly) {
    conditions.push('is_favorite = 1')
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const rows = db.prepare(query).all(...params)
  return rows.map(formatStory)
}

export function getStoryCount() {
  const row = db.prepare('SELECT COUNT(*) as count FROM stories').get()
  return row.count
}

export function deleteStory(id) {
  const result = db.prepare('DELETE FROM stories WHERE id = ?').run(id)
  return result.changes > 0
}

export function toggleFavorite(id) {
  const row = db.prepare('SELECT is_favorite FROM stories WHERE id = ?').get(id)
  if (!row) return null
  const newValue = row.is_favorite ? 0 : 1
  db.prepare('UPDATE stories SET is_favorite = ?, updated_at = datetime("now", "localtime") WHERE id = ?').run(newValue, id)
  return newValue === 1
}

export function getFavorites() {
  const rows = db.prepare('SELECT id FROM stories WHERE is_favorite = 1 ORDER BY created_at DESC').all()
  return rows.map(r => r.id)
}

export function saveWorkflowState(state) {
  const stmt = db.prepare(`
    INSERT INTO workflow_states (id, story_id, current_stage, stage_data, status)
    VALUES (@id, @storyId, @currentStage, @stageData, @status)
    ON CONFLICT(id) DO UPDATE SET
      current_stage = @currentStage,
      stage_data = @stageData,
      status = @status,
      updated_at = datetime('now', 'localtime')
  `)
  stmt.run({
    id: state.id,
    storyId: state.storyId || null,
    currentStage: state.currentStage,
    stageData: JSON.stringify(state.stageData || {}),
    status: state.status,
  })
  return state
}

export function getWorkflowState(id) {
  const row = db.prepare('SELECT * FROM workflow_states WHERE id = ?').get(id)
  if (!row) return null
  return {
    ...row,
    stageData: JSON.parse(row.stage_data),
  }
}

export function deleteWorkflowState(id) {
  db.prepare('DELETE FROM workflow_states WHERE id = ?').run(id)
}

function formatStory(row) {
  return {
    id: row.id,
    productName: row.product_name,
    productDesc: row.product_desc,
    template: row.template,
    targetUser: row.target_user,
    tone: row.tone,
    result: JSON.parse(row.result),
    isFavorite: row.is_favorite === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default db
