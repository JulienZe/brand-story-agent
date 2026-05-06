import { Component } from 'react'
import { Icon } from './Icon'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('[ErrorBoundary] 捕获错误:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-inner">
            <div className="error-boundary-icon">
              <Icon name="alert" size={32} />
            </div>
            <h3 className="error-boundary-title">页面出现了问题</h3>
            <p className="error-boundary-desc">
              {this.state.error?.message || '发生了未知错误'}
            </p>
            {import.meta.env?.DEV && this.state.errorInfo && (
              <details className="error-boundary-details">
                <summary>错误详情</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            <div className="error-boundary-actions">
              <button className="btn btn-ghost btn-sm" onClick={this.handleReset}>
                重试
              </button>
              <button className="btn btn-primary btn-sm" onClick={this.handleReload}>
                刷新页面
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
