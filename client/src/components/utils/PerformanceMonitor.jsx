import React, { useState, useEffect } from 'react'
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring'
import LocalFileManager from '../../utils/LocalFileManager'
import performanceOptimizer from '../../utils/PerformanceOptimizer'

/**
 * Performance Monitor Component
 * 
 * Provides a UI for monitoring and managing performance in the multi-goal architecture.
 * Shows real-time metrics, recommendations, and cleanup options.
 */
const PerformanceMonitor = ({ isVisible, onClose }) => {
  const {
    generatePerformanceReport,
    generatePerformanceRecommendations,
    optimizeFileStorage,
    cleanup,
    currentMemoryUsage,
    goalSwitchCount
  } = usePerformanceMonitoring()

  const [report, setReport] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [storageAnalysis, setStorageAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Update data when component becomes visible
  useEffect(() => {
    if (isVisible) {
      updateData()
    }
  }, [isVisible])

  const updateData = async () => {
    setIsLoading(true)
    try {
      const [perfReport, recs, storageOpt] = await Promise.all([
        generatePerformanceReport(),
        generatePerformanceRecommendations(),
        optimizeFileStorage()
      ])

      setReport(perfReport)
      setRecommendations(recs)
      setStorageAnalysis(storageOpt)
    } catch (error) {
      console.error('Failed to update performance data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanup = async () => {
    setIsLoading(true)
    try {
      await cleanup()
      await updateData() // Refresh data after cleanup
    } catch (error) {
      console.error('Cleanup failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    performanceOptimizer.exportPerformanceData()
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'normal': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-blue-500 bg-blue-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={updateData}
              disabled={isLoading}
              className="btn-primary btn-md"
            >
              {isLoading ? 'Updating...' : 'Refresh'}
            </button>
            <button
              onClick={handleExportData}
              className="btn-primary btn-md"
            >
              Export Data
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {['overview', 'memory', 'storage', 'recommendations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600">Goal Switches</h3>
                  <p className="text-2xl font-bold text-blue-900">{goalSwitchCount}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600">Memory Usage</h3>
                  <p className="text-2xl font-bold text-green-900">
                    {currentMemoryUsage ? `${currentMemoryUsage.percentage.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-600">Storage Files</h3>
                  <p className="text-2xl font-bold text-purple-900">
                    {storageAnalysis?.analysis?.totalFiles || 0}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-600">Recommendations</h3>
                  <p className="text-2xl font-bold text-orange-900">{recommendations.length}</p>
                </div>
              </div>

              {/* Performance Summary */}
              {report && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Goal Switching</h4>
                      <p className="text-sm text-gray-600">
                        Average: {formatDuration(report.summary.goalSwitches?.averageTime || 0)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Slow switches: {report.summary.goalSwitches?.slowSwitches || 0}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">API Performance</h4>
                      <p className="text-sm text-gray-600">
                        Average: {formatDuration(report.summary.apiPerformance?.averageTime || 0)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Slow calls: {report.summary.apiPerformance?.slowCalls || 0}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Memory</h4>
                      <p className="text-sm text-gray-600">
                        Current: {formatBytes(report.summary.memoryUsage?.current || 0)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Peak: {formatBytes(report.summary.memoryUsage?.peak || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Memory Usage</h3>
                {currentMemoryUsage ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Used Memory:</span>
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(currentMemoryUsage.status)}`}>
                        {formatBytes(currentMemoryUsage.used)} ({currentMemoryUsage.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          currentMemoryUsage.status === 'critical' ? 'bg-red-500' :
                          currentMemoryUsage.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(currentMemoryUsage.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      Limit: {formatBytes(currentMemoryUsage.limit)}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Memory information not available</p>
                )}
              </div>

              {report?.memory && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Memory Trends</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Current</h4>
                      <p className="text-lg">{formatBytes(report.memory.current?.usedJSHeapSize || 0)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Average</h4>
                      <p className="text-lg">{formatBytes(report.memory.average || 0)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Peak</h4>
                      <p className="text-lg">{formatBytes(report.memory.peak || 0)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-6">
              {storageAnalysis?.analysis && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Storage Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Overview</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Files:</span>
                          <span>{storageAnalysis.analysis.totalFiles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Size:</span>
                          <span>{storageAnalysis.analysis.formattedTotalSize}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Files by Age</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Last 7 days:</span>
                          <span>{storageAnalysis.analysis.filesByAge.last7Days}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last 30 days:</span>
                          <span>{storageAnalysis.analysis.filesByAge.last30Days}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Older:</span>
                          <span>{storageAnalysis.analysis.filesByAge.older}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {storageAnalysis.analysis.largestFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-700 mb-2">Largest Files</h4>
                      <div className="space-y-2">
                        {storageAnalysis.analysis.largestFiles.slice(0, 5).map((file, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="truncate">{file.name}</span>
                            <span>{file.formattedSize}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Storage Actions</h3>
                <div className="space-y-4">
                  <button
                    onClick={handleCleanup}
                    disabled={isLoading}
                    className="btn-danger btn-md w-full"
                  >
                    {isLoading ? 'Cleaning...' : 'Clean Up Old Files'}
                  </button>
                  <p className="text-sm text-gray-600">
                    This will remove files older than 30 days and optimize storage usage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <div key={index} className={`border-l-4 p-4 rounded ${getPriorityColor(rec.priority)}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{rec.category}</h4>
                        <p className="text-sm text-gray-700 mt-1">{rec.message}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded uppercase font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-500 text-6xl mb-4">✓</div>
                  <h3 className="text-lg font-medium text-gray-900">All Good!</h3>
                  <p className="text-gray-600">No performance recommendations at this time.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PerformanceMonitor