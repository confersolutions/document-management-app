# Document Management System

A full-stack document management application with React frontend, FastAPI backend, and external Qdrant vector database integration.

## Features

- **Document Upload**: Support for PDF, DOCX, XLSX, TXT, and Markdown files
- **Qdrant Integration**: Connect to external Qdrant instance with UI-based configuration
- **Collection Management**: Fetch and select existing collections or create new ones
- **Text Processing**: Configurable chunking strategies and vector embeddings
- **Index Management**: View, delete, and manage document collections
- **Responsive UI**: Modern interface built with React and Tailwind CSS

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python 3.12 + Poetry
- **Vector Database**: External Qdrant instance (user-provided)
- **Embeddings**: OpenAI text-embedding-3-small (with mock fallback)

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose
- External Qdrant instance running and accessible

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd document-management-app
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` file with your configuration:
```bash
# Add your OpenAI API key (optional - will use mock embeddings if not provided)
OPENAI_API_KEY=your_openai_api_key_here

# Frontend API URL for local development
VITE_API_URL=http://localhost:8000
```

4. Build and start services:
```bash
docker-compose up --build
```

5. Access the application:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8001
   - API Documentation: http://localhost:8001/docs

### Using the Application

1. **Connect to Qdrant**: Enter your Qdrant URL and API key (if required) in the connection form
2. **Select Collection**: Choose an existing collection or create a new one
3. **Upload Documents**: Select files, configure metadata and chunking parameters
4. **Manage Documents**: View, delete documents and collections in the management interface

## Coolify Deployment

### Prerequisites

- Coolify instance running on your VPS
- External Qdrant instance accessible from your VPS
- GitHub repository with this code

### Deployment Steps

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Configure Coolify**:
   - Create new application in Coolify
   - Connect to your GitHub repository
   - Set build pack to "Docker Compose"
   - Configure environment variables:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     VITE_API_URL=https://your-backend-domain.com
     ```

3. **Deploy**:
   - Coolify will automatically build and deploy both services
   - Frontend will be available on port 3001
   - Backend will be available on port 8001

### Environment Variables for Production

```bash
# Required for OpenAI embeddings (optional - uses mock if not provided)
OPENAI_API_KEY=your_openai_api_key_here

# Frontend API URL - should point to your deployed backend
VITE_API_URL=https://your-backend-domain.com
```

## Development

### Backend Development

```bash
cd backend
poetry install
poetry run fastapi dev app/main.py
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /health` - Health check
- `POST /qdrant/test-connection` - Test Qdrant connection
- `POST /qdrant/collections` - Get available collections
- `POST /upload` - Upload document
- `GET /indexes` - Get all indexes
- `GET /indexes/{index_name}/documents` - Get documents in index
- `DELETE /indexes/{index_name}/documents/{document_id}` - Delete document
- `DELETE /indexes/{index_name}` - Delete index
- `POST /indexes/{index_name}/search` - Search documents

## Configuration

### Chunking Strategies

- **Recursive**: Split text into overlapping chunks of specified size
- **Sentence**: Split text by sentences, respecting chunk size limits

### Supported File Types

- PDF (.pdf)
- Word Documents (.docx)
- Excel Spreadsheets (.xlsx, .xls)
- Text Files (.txt)
- Markdown (.md)

### File Size Limits

- Maximum file size: 20MB per document

## Troubleshooting

### Common Issues

1. **Qdrant Connection Failed**: Verify URL and API key, ensure Qdrant is accessible
2. **Upload Fails**: Check file size (max 20MB) and file type support
3. **Build Errors**: Ensure all dependencies are properly installed

### Logs

- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
- All logs: `docker-compose logs`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
