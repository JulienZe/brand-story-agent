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
    rating INTEGER DEFAULT 0,
    current_version INTEGER DEFAULT 1,
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

  CREATE TABLE IF NOT EXISTS story_versions (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    result TEXT NOT NULL,
    change_type TEXT DEFAULT 'create',
    change_summary TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    UNIQUE(story_id, version)
  );

  CREATE INDEX IF NOT EXISTS idx_versions_story_id ON story_versions(story_id, version DESC);

  CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id TEXT,
    stage TEXT,
    provider TEXT,
    model TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    success INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_usage_logs_provider ON usage_logs(provider);
`)

const migrateRating = db.prepare(`SELECT COUNT(*) as cnt FROM pragma_table_info('stories') WHERE name = 'rating'`)
if (migrateRating.get().cnt === 0) {
  db.exec(`ALTER TABLE stories ADD COLUMN rating INTEGER DEFAULT 0`)
}

const migrateVersion = db.prepare(`SELECT COUNT(*) as cnt FROM pragma_table_info('stories') WHERE name = 'current_version'`)
if (migrateVersion.get().cnt === 0) {
  db.exec(`ALTER TABLE stories ADD COLUMN current_version INTEGER DEFAULT 1`)
}

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

  createVersion({
    id: `v_${record.id}_1`,
    storyId: record.id,
    version: 1,
    result: record.result,
    changeType: 'create',
    changeSummary: '初始创作',
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

export function updateStoryResult(id, result) {
  const story = db.prepare('SELECT current_version FROM stories WHERE id = ?').get(id)
  if (!story) return null

  const nextVersion = story.current_version + 1

  db.prepare(`
    UPDATE stories SET result = ?, current_version = ?, updated_at = datetime('now', 'localtime') WHERE id = ?
  `).run(JSON.stringify(result), nextVersion, id)

  createVersion({
    id: `v_${id}_${nextVersion}`,
    storyId: id,
    version: nextVersion,
    result,
    changeType: 'edit',
    changeSummary: '内容编辑',
  })

  return getStory(id)
}

export function updateStoryRating(id, rating) {
  const result = db.prepare(`
    UPDATE stories SET rating = ?, updated_at = datetime('now', 'localtime') WHERE id = ?
  `).run(rating, id)
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

export function createVersion({ id, storyId, version, result, changeType, changeSummary }) {
  const stmt = db.prepare(`
    INSERT INTO story_versions (id, story_id, version, result, change_type, change_summary)
    VALUES (@id, @storyId, @version, @result, @changeType, @changeSummary)
  `)
  stmt.run({
    id,
    storyId,
    version,
    result: JSON.stringify(result),
    changeType: changeType || 'create',
    changeSummary: changeSummary || '',
  })
  return getVersion(id)
}

export function getVersion(id) {
  const row = db.prepare('SELECT * FROM story_versions WHERE id = ?').get(id)
  if (!row) return null
  return formatVersion(row)
}

export function getVersionsByStoryId(storyId) {
  const rows = db.prepare('SELECT * FROM story_versions WHERE story_id = ? ORDER BY version DESC').all(storyId)
  return rows.map(formatVersion)
}

export function getVersionByNumber(storyId, version) {
  const row = db.prepare('SELECT * FROM story_versions WHERE story_id = ? AND version = ?').get(storyId, version)
  if (!row) return null
  return formatVersion(row)
}

export function deleteVersion(id) {
  const result = db.prepare('DELETE FROM story_versions WHERE id = ?').run(id)
  return result.changes > 0
}

export function logUsage({ storyId, stage, provider, model, inputTokens, outputTokens, cost, durationMs, success }) {
  db.prepare(`
    INSERT INTO usage_logs (story_id, stage, provider, model, input_tokens, output_tokens, cost, duration_ms, success)
    VALUES (@storyId, @stage, @provider, @model, @inputTokens, @outputTokens, @cost, @durationMs, @success)
  `).run({
    storyId: storyId || null,
    stage: stage || null,
    provider: provider || null,
    model: model || null,
    inputTokens: inputTokens || 0,
    outputTokens: outputTokens || 0,
    cost: cost || 0,
    durationMs: durationMs || 0,
    success: success !== undefined ? (success ? 1 : 0) : 1,
  })
}

export function getUsageStats({ days = 30 } = {}) {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const rows = db.prepare(`
    SELECT
      provider,
      model,
      COUNT(*) as call_count,
      SUM(input_tokens) as total_input_tokens,
      SUM(output_tokens) as total_output_tokens,
      SUM(cost) as total_cost,
      AVG(duration_ms) as avg_duration_ms,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as fail_count
    FROM usage_logs
    WHERE created_at >= ?
    GROUP BY provider, model
    ORDER BY call_count DESC
  `).all(since)

  const dailyRows = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(cost) as cost,
      SUM(input_tokens + output_tokens) as tokens
    FROM usage_logs
    WHERE created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(since)

  return { byProvider: rows, daily: dailyRows, days }
}

export function getDashboardStats() {
  const totalStories = db.prepare('SELECT COUNT(*) as count FROM stories').get().count
  const totalWords = db.prepare(`
    SELECT SUM(LENGTH(result) - LENGTH(REPLACE(result, '"', ''))) as approx_words FROM stories
  `).get().approx_words || 0

  const templateDist = db.prepare(`
    SELECT template, COUNT(*) as count FROM stories WHERE template IS NOT NULL GROUP BY template ORDER BY count DESC
  `).all()

  const recentStories = db.prepare(`
    SELECT id, product_name, created_at FROM stories ORDER BY created_at DESC LIMIT 5
  `).all()

  const avgRating = db.prepare(`
    SELECT AVG(rating) as avg FROM stories WHERE rating > 0
  `).get().avg || 0

  const favCount = db.prepare('SELECT COUNT(*) as count FROM stories WHERE is_favorite = 1').get().count

  const totalCost = db.prepare('SELECT SUM(cost) as total FROM usage_logs').get().total || 0

  return {
    totalStories,
    totalWords: Math.round(totalWords),
    templateDist,
    recentStories,
    avgRating: Math.round(avgRating * 10) / 10,
    favCount,
    totalCost: Math.round(totalCost * 10000) / 10000,
  }
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
    rating: row.rating || 0,
    currentVersion: row.current_version || 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function formatVersion(row) {
  return {
    id: row.id,
    storyId: row.story_id,
    version: row.version,
    result: JSON.parse(row.result),
    changeType: row.change_type,
    changeSummary: row.change_summary,
    createdAt: row.created_at,
  }
}

export default db
