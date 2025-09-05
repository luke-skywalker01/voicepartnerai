'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Edit, 
  Filter,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  FileIcon,
  MoreVertical
} from 'lucide-react'

interface FileData {
  id: string
  filename: string
  originalName: string
  fileType: string
  fileSize: number
  s3Url?: string
  uploadedAt: string
  ownerId: string
  status: 'uploading' | 'processed' | 'error'
  extractedText?: string
  description?: string
}

interface FileStats {
  totalFiles: number
  totalSize: number
  byType: Record<string, number>
  byStatus: Record<string, number>
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileData[]>([])
  const [stats, setStats] = useState<FileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pdf' | 'text' | 'processed' | 'error'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadFiles()
  }, [filter])

  const loadFiles = async () => {
    setLoading(true)
    try {
      let url = '/api/files?limit=50'
      if (filter !== 'all') {
        if (['pdf', 'text'].includes(filter)) {
          url += `&type=${filter === 'pdf' ? 'pdf' : 'text'}`
        } else {
          url += `&status=${filter}`
        }
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.data.files)
        setStats(data.data.stats)
      } else {
        console.error('Failed to load files:', data.error)
      }
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    setUploading(true)
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadFiles() // Reload files list
        setShowUploadDialog(false)
        ;(event.target as HTMLFormElement).reset()
      } else {
        alert(`Upload failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Datei löschen möchten?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/files?id=${fileId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadFiles() // Reload files list
      } else {
        alert(`Delete failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Delete failed')
    }
  }

  const filteredFiles = files.filter(file =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('text')) return '📝'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('word')) return '📃'
    return '📁'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'uploading': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Files</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Ihre Dateien für die KI-Wissensbasis
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => loadFiles()}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </button>
          <button
            onClick={() => setShowUploadDialog(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Datei hochladen
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamt Dateien</p>
                <p className="text-2xl font-bold">{stats.totalFiles}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Speicherplatz</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
              <Upload className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verarbeitet</p>
                <p className="text-2xl font-bold">{stats.byStatus.processed || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">PDF Dateien</p>
                <p className="text-2xl font-bold">{stats.byType.application || 0}</p>
              </div>
              <FileIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Dateien durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          {['all', 'pdf', 'text', 'processed', 'error'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
              }`}
            >
              {filterOption === 'all' ? 'Alle' : 
               filterOption === 'pdf' ? 'PDF' :
               filterOption === 'text' ? 'Text' :
               filterOption === 'processed' ? 'Verarbeitet' : 'Fehler'}
            </button>
          ))}
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Datei
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Größe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Hochgeladen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Lade Dateien...</p>
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium mb-2">Keine Dateien gefunden</p>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Versuchen Sie andere Suchbegriffe' : 'Laden Sie Ihre erste Datei hoch'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getFileIcon(file.fileType)}</span>
                        <div>
                          <p className="font-medium text-foreground">{file.originalName}</p>
                          <p className="text-sm text-muted-foreground">{file.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {file.fileType.split('/')[1]?.toUpperCase() || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(file.status)}
                        <span className="ml-2 text-sm capitalize">{file.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(file.uploadedAt).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedFile(file)
                            setShowPreviewDialog(true)
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground rounded"
                          title="Vorschau"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1 text-red-600 hover:text-red-800 rounded"
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Datei hochladen</h3>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Datei auswählen</label>
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.txt,.csv,.json,.doc,.docx"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Unterstützte Formate: PDF, TXT, CSV, JSON, DOC, DOCX (max. 10MB)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Beschreibung (Optional)</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Beschreiben Sie den Inhalt dieser Datei..."
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadDialog(false)}
                  className="flex-1 border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                      Hochladen...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Hochladen
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      {showPreviewDialog && selectedFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedFile.originalName}</h3>
              <button
                onClick={() => setShowPreviewDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Dateityp:</p>
                  <p className="text-muted-foreground">{selectedFile.fileType}</p>
                </div>
                <div>
                  <p className="font-medium">Größe:</p>
                  <p className="text-muted-foreground">{formatFileSize(selectedFile.fileSize)}</p>
                </div>
                <div>
                  <p className="font-medium">Status:</p>
                  <p className="text-muted-foreground capitalize">{selectedFile.status}</p>
                </div>
                <div>
                  <p className="font-medium">Hochgeladen:</p>
                  <p className="text-muted-foreground">
                    {new Date(selectedFile.uploadedAt).toLocaleString('de-DE')}
                  </p>
                </div>
              </div>
              {selectedFile.description && (
                <div>
                  <p className="font-medium mb-2">Beschreibung:</p>
                  <p className="text-muted-foreground">{selectedFile.description}</p>
                </div>
              )}
              {selectedFile.extractedText && (
                <div>
                  <p className="font-medium mb-2">Extrahierter Text:</p>
                  <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {selectedFile.extractedText}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}