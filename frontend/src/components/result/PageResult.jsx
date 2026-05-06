import { useState, useCallback } from 'react'
import { Icon } from '../common/Icon'
import { StoryViewer } from './StoryViewer'
import { TEMPLATES } from '../../constants'

export function PageResult({ record, onBack, onNew, onUpdateRecord, showToast }) {
  const [currentRecord, setCurrentRecord] = useState(record)

  const handleResultUpdate = useCallback((updated) => {
    const merged = {
      ...currentRecord,
      result: updated.result || updated,
      currentVersion: updated.currentVersion || currentRecord.currentVersion,
    }
    setCurrentRecord(merged)
    onUpdateRecord?.(merged)
  }, [currentRecord, onUpdateRecord])

  const handleRatingChange = useCallback((newRating) => {
    setCurrentRecord((prev) => ({ ...prev, rating: newRating }))
  }, [])

  return (
    <div className="page page-result">
      <div className="result-header">
        <div className="result-header-left">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <Icon name="clock" size={14} /> 历史记录
          </button>
          <div className="result-title-group">
            <h2 className="result-product-name">{currentRecord.productName}</h2>
            <div className="result-meta">
              {currentRecord.template && (
                <span className="result-template">
                  {TEMPLATES.find(t => t.id === currentRecord.template)?.icon} {TEMPLATES.find(t => t.id === currentRecord.template)?.name}
                </span>
              )}
              <span className="result-date">{new Date(currentRecord.createdAt).toLocaleString('zh-CN')}</span>
              {currentRecord.currentVersion > 1 && (
                <span className="result-version">v{currentRecord.currentVersion}</span>
              )}
            </div>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onNew}>
          <Icon name="pen" size={14} />
          新建创作
        </button>
      </div>
      <StoryViewer
        result={currentRecord.result}
        productName={currentRecord.productName}
        storyId={currentRecord.id}
        rating={currentRecord.rating}
        currentVersion={currentRecord.currentVersion}
        onResultUpdate={handleResultUpdate}
        onRatingChange={handleRatingChange}
        showToast={showToast}
      />
    </div>
  )
}
