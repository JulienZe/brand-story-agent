import { Icon } from '../common/Icon'
import { StoryViewer } from './StoryViewer'
import { TEMPLATES } from '../../constants'

export function PageResult({ record, onBack, onNew, onNavigate }) {
  return (
    <div className="page page-result">
      <div className="result-header">
        <div className="result-header-left">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <Icon name="clock" size={14} /> 历史记录
          </button>
          <div className="result-title-group">
            <h2 className="result-product-name">{record.productName}</h2>
            <div className="result-meta">
              {record.template && (
                <span className="result-template">
                  {TEMPLATES.find(t => t.id === record.template)?.icon} {TEMPLATES.find(t => t.id === record.template)?.name}
                </span>
              )}
              <span className="result-date">{new Date(record.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onNew}>
          <Icon name="pen" size={14} />
          新建创作
        </button>
      </div>
      <StoryViewer result={record.result} productName={record.productName} />
    </div>
  )
}
