from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from .document_api import (
    get_indexes, get_index_documents, upload_document, 
    delete_document, delete_index, search_documents,
    get_qdrant_client, IndexInfo, DocumentInfo
)

app = FastAPI(title="Document Management API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/indexes", response_model=List[IndexInfo])
async def api_get_indexes():
    """Get all existing indexes with document counts"""
    return get_indexes()

@app.post("/qdrant/test-connection")
async def test_qdrant_connection(connection: dict):
    """Test connection to Qdrant instance"""
    url = connection.get("url")
    api_key = connection.get("api_key")
    client = get_qdrant_client(url, api_key)
    return {"status": "success", "message": "Connection successful"}

@app.post("/qdrant/collections")
async def get_qdrant_collections(connection: dict):
    """Get all collections from Qdrant instance"""
    url = connection.get("url")
    api_key = connection.get("api_key")
    client = get_qdrant_client(url, api_key)
    collections = client.get_collections()
    return {"collections": [col.name for col in collections.collections]}

@app.get("/indexes/{index_name}/documents", response_model=List[DocumentInfo])
async def api_get_index_documents(index_name: str):
    """Get all documents in a specific index"""
    return get_index_documents(index_name)

@app.post("/upload")
async def api_upload_document(
    file: UploadFile = File(...),
    metadata: str = Form(...),
    qdrant_url: str = Form(...),
    qdrant_api_key: str = Form(None)
):
    """Upload and process a document"""
    return await upload_document(file, metadata, qdrant_url, qdrant_api_key)

@app.delete("/indexes/{index_name}/documents/{document_id}")
async def api_delete_document(
    index_name: str, 
    document_id: str,
    qdrant_url: str,
    qdrant_api_key: Optional[str] = None
):
    """Delete a specific document from an index"""
    return delete_document(index_name, document_id, qdrant_url, qdrant_api_key)

@app.delete("/indexes/{index_name}")
async def api_delete_index(
    index_name: str,
    qdrant_url: str,
    qdrant_api_key: Optional[str] = None
):
    """Delete an entire index"""
    return delete_index(index_name, qdrant_url, qdrant_api_key)

@app.post("/search/{index_name}")
async def api_search_documents(
    index_name: str, 
    query: dict,
    qdrant_url: str,
    qdrant_api_key: Optional[str] = None
):
    """Search documents in an index"""
    return await search_documents(index_name, query, qdrant_url, qdrant_api_key)
