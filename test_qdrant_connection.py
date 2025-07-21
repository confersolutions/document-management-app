#!/usr/bin/env python3

import sys
sys.path.append('/home/ubuntu/document-management-app/backend')

from app.document_api import get_qdrant_client

def test_connection():
    url = "https://qdrant.confersolutions.ai:6333"
    api_key = "yKRi9yNg0lT65Jy74iPQmd44pX4HGpaU"
    
    print(f"Testing connection to: {url}")
    print(f"Using API key: {api_key[:10]}...")
    
    try:
        client = get_qdrant_client(url, api_key)
        print("✅ Connection successful!")
        
        collections = client.get_collections()
        print(f"✅ Found {len(collections.collections)} collections:")
        for col in collections.collections:
            print(f"  - {col.name}")
            
        collection_names = [col.name for col in collections.collections]
        if 'confer-website' in collection_names:
            print("✅ Found 'confer-website' collection!")
        else:
            print("❌ 'confer-website' collection not found")
            
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_connection()
