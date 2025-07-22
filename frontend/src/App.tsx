import { useState, useEffect } from 'react'
import { Upload, FileText, Trash2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

interface IndexInfo {
  name: string
  description: string
  document_count: number
  created_at: string
}

interface DocumentInfo {
  id: string
  filename: string
  file_type: string
  size: number
  chunks_count: number
  uploaded_at: string
}

interface UploadMetadata {
  index_name: string
  description: string
  chunk_size: number
  chunk_overlap: number
  chunking_method: string
}

function App() {
  const [indexes, setIndexes] = useState<IndexInfo[]>([])
  const [selectedIndex, setSelectedIndex] = useState<string>('')
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [activeTab, setActiveTab] = useState('upload')
  const [qdrantConnection, setQdrantConnection] = useState({
    url: 'https://qdrant.confersolutions.ai',
    apiKey: 'yKRi9yNg0lT65Jy74iPQmd44pX4HGpaU',
    isConnected: false,
    collections: []
  })
  const [selectedCollection, setSelectedCollection] = useState('')
  const [newCollectionName, setNewCollectionName] = useState('')

  const [uploadMetadata, setUploadMetadata] = useState<UploadMetadata>({
    index_name: '',
    description: '',
    chunk_size: 1000,
    chunk_overlap: 200,
    chunking_method: 'recursive'
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchIndexes()
  }, [])

  // Debug useEffect to monitor qdrantConnection state changes
  useEffect(() => {
    console.log('🔄 qdrantConnection state changed:', qdrantConnection)
  }, [qdrantConnection])

  const testQdrantConnection = async () => {
    try {
      console.log('🔗 Starting Qdrant connection test...')
      setIsUploading(true)
      const response = await fetch(`${API_URL}/qdrant/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: qdrantConnection.url,
          api_key: qdrantConnection.apiKey
        })
      })
      
      if (response.ok) {
        console.log('✅ Connection test successful, fetching collections...')
        await fetchCollections()
        console.log('🔄 Setting connection state to connected...')
        setQdrantConnection(prev => {
          const newState = {...prev, isConnected: true}
          console.log('📊 Updated qdrantConnection state:', newState)
          return newState
        })
        setSuccess('Connected to Qdrant successfully!')
        setError('')
      } else {
        console.error('❌ Connection test failed:', response.status, response.statusText)
        setError('Failed to connect to Qdrant')
        setSuccess('')
      }
    } catch (error) {
      console.error('❌ Connection test error:', error)
      setError('Failed to connect to Qdrant')
      setSuccess('')
    } finally {
      setIsUploading(false)
    }
  }

  const fetchCollections = async () => {
    try {
      console.log('Fetching collections...')
      const response = await fetch(`${API_URL}/qdrant/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: qdrantConnection.url,
          api_key: qdrantConnection.apiKey
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Collections received:', data.collections)
        setQdrantConnection(prev => {
          const newState = {...prev, collections: data.collections}
          console.log('Updated qdrantConnection state:', newState)
          return newState
        })
      } else {
        console.error('Failed to fetch collections:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
  }

  const fetchIndexes = async () => {
    try {
      const response = await fetch(`${API_URL}/indexes`)
      if (response.ok) {
        const data = await response.json()
        setIndexes(data)
      } else {
        setError('Failed to fetch indexes')
      }
    } catch (error) {
      setError('Network error while fetching indexes')
    }
  }

  const fetchDocuments = async (indexName: string) => {
    try {
      const response = await fetch(`${API_URL}/indexes/${indexName}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      } else {
        setError('Failed to fetch documents')
      }
    } catch (error) {
      setError('Network error while fetching documents')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('File size exceeds 20MB limit')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || isUploading || !qdrantConnection.isConnected) return

    const targetCollection = selectedCollection === '__create_new__' ? newCollectionName : selectedCollection
    if (!targetCollection) return

    setIsUploading(true)
    setUploadProgress(0)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('metadata', JSON.stringify({
      ...uploadMetadata,
      index_name: targetCollection
    }))
    formData.append('qdrant_url', qdrantConnection.url)
    if (qdrantConnection.apiKey) {
      formData.append('qdrant_api_key', qdrantConnection.apiKey)
    }

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(`Document uploaded successfully! Processed ${result.chunks_processed} chunks.`)
        setSelectedFile(null)
        setUploadMetadata({
          index_name: '',
          description: '',
          chunk_size: 1000,
          chunk_overlap: 200,
          chunking_method: 'recursive'
        })
        fetchIndexes()
        fetchCollections()
      } else {
        const errorData = await response.json()
        setError(`Upload failed: ${errorData.detail}`)
      }
    } catch (error) {
      setError('Network error occurred during upload')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedIndex || !qdrantConnection.isConnected) return
    
    try {
      const response = await fetch(`${API_URL}/indexes/${selectedIndex}/documents/${documentId}?qdrant_url=${encodeURIComponent(qdrantConnection.url)}&qdrant_api_key=${encodeURIComponent(qdrantConnection.apiKey || '')}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Document deleted successfully')
        fetchDocuments(selectedIndex)
        fetchIndexes()
      } else {
        setError('Failed to delete document')
      }
    } catch (error) {
      setError('Error deleting document')
    }
  }

  const handleDeleteIndex = async (indexName: string) => {
    if (!confirm(`Are you sure you want to delete the index "${indexName}"? This will delete all documents in the index.`) || !qdrantConnection.isConnected) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/indexes/${indexName}?qdrant_url=${encodeURIComponent(qdrantConnection.url)}&qdrant_api_key=${encodeURIComponent(qdrantConnection.apiKey || '')}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Index deleted successfully')
        setSelectedIndex('')
        setDocuments([])
        fetchIndexes()
        fetchCollections()
      } else {
        setError('Failed to delete index')
      }
    } catch (error) {
      setError('Error deleting index')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Management System</h1>
          <p className="text-gray-600">Upload, manage, and search your documents with AI-powered vectorization</p>
        </header>

        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Qdrant Connection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              type="url"
              placeholder="Qdrant URL (pre-filled with default)"
              value={qdrantConnection.url}
              onChange={(e) => setQdrantConnection({...qdrantConnection, url: e.target.value})}
            />
            <Input
              type="password"
              placeholder="API Key (pre-filled with default)"
              value={qdrantConnection.apiKey}
              onChange={(e) => setQdrantConnection({...qdrantConnection, apiKey: e.target.value})}
            />
          </div>
          <Button 
            onClick={testQdrantConnection} 
            disabled={!qdrantConnection.url || isUploading}
            className="mr-4"
          >
            {isUploading ? 'Connecting...' : (qdrantConnection.isConnected ? 'Reconnect' : 'Connect to Qdrant')}
          </Button>
          {qdrantConnection.isConnected && (
            <span className="text-green-600 font-medium">✓ Connected</span>
          )}
        </div>

        {(error || success) && (
          <Alert className={`mb-6 ${error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertDescription className={error ? 'text-red-800' : 'text-green-800'}>
              {error || success}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
            <TabsTrigger value="manage">Manage Indexes</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Document
                </CardTitle>
                <CardDescription>
                  Upload and process documents for vector search. Supports PDF, DOCX, XLSX, TXT, and Markdown files.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="collection">Collection</Label>
                      <Select
                        value={selectedCollection}
                        onValueChange={setSelectedCollection}
                        disabled={!qdrantConnection.isConnected}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Collection" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            console.log('Rendering collections dropdown, collections:', qdrantConnection.collections)
                            return qdrantConnection.collections.map(collection => (
                              <SelectItem key={collection} value={collection}>{collection}</SelectItem>
                            ))
                          })()}
                          <SelectItem value="__create_new__">Create New Collection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedCollection === '__create_new__' && (
                      <div>
                        <Label htmlFor="new_collection">New Collection Name</Label>
                        <Input
                          id="new_collection"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          placeholder="Enter new collection name"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        value={uploadMetadata.description}
                        onChange={(e) => setUploadMetadata({...uploadMetadata, description: e.target.value})}
                        placeholder="Brief description of the document"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="chunk_size">Chunk Size</Label>
                        <Input
                          id="chunk_size"
                          type="number"
                          value={uploadMetadata.chunk_size}
                          onChange={(e) => setUploadMetadata({...uploadMetadata, chunk_size: parseInt(e.target.value)})}
                          min="100"
                          max="4000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="chunk_overlap">Chunk Overlap</Label>
                        <Input
                          id="chunk_overlap"
                          type="number"
                          value={uploadMetadata.chunk_overlap}
                          onChange={(e) => setUploadMetadata({...uploadMetadata, chunk_overlap: parseInt(e.target.value)})}
                          min="0"
                          max="1000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="chunking_method">Chunking Method</Label>
                        <Select
                          value={uploadMetadata.chunking_method}
                          onValueChange={(value) => setUploadMetadata({...uploadMetadata, chunking_method: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recursive">Recursive</SelectItem>
                            <SelectItem value="sentence">Sentence-based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="file">Select File</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileSelect}
                        accept=".pdf,.docx,.xlsx,.xls,.txt,.md"
                        className="cursor-pointer"
                      />
                      {selectedFile && (
                        <p className="text-sm text-gray-600 mt-2">
                          Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={!selectedFile || isUploading || !qdrantConnection.isConnected || (!selectedCollection || (selectedCollection === '__create_new__' && !newCollectionName))}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Upload className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Document Indexes
                </CardTitle>
                <CardDescription>
                  Manage your document collections and view stored documents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {indexes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No indexes found. Upload some documents to get started.</p>
                  ) : (
                    <div className="grid gap-4">
                      {indexes.map((index) => (
                        <div key={index.name} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{index.name}</h3>
                              <p className="text-gray-600 text-sm">{index.description || 'No description'}</p>
                              <div className="flex gap-4 text-sm text-gray-500 mt-2">
                                <span>{index.document_count} documents</span>
                                <span>Created: {formatDate(index.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedIndex(index.name)
                                  fetchDocuments(index.name)
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View Documents
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteIndex(index.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedIndex && (
              <Card>
                <CardHeader>
                  <CardTitle>Documents in "{selectedIndex}"</CardTitle>
                  <CardDescription>
                    Manage individual documents within this index.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No documents found in this index.</p>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{doc.filename}</h4>
                            <div className="flex gap-4 text-sm text-gray-500">
                              <span>{doc.file_type.toUpperCase()}</span>
                              <span>{formatFileSize(doc.size)}</span>
                              <span>{doc.chunks_count} chunks</span>
                              <span>Uploaded: {formatDate(doc.uploaded_at)}</span>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
