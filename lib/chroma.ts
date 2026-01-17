import { ChromaClient, Collection } from 'chromadb'

let client: ChromaClient | null = null
let collection: Collection | null = null

const COLLECTION_NAME = 'gbrain_knowledge'

export async function getChromaClient(): Promise<ChromaClient> {
  if (!client) {
    client = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000',
    })
  }
  return client
}

export async function getCollection(): Promise<Collection> {
  if (!collection) {
    const chromaClient = await getChromaClient()
    collection = await chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { description: 'GBrain security knowledge base' },
    })
  }
  return collection
}

export interface KnowledgeDocument {
  id: string
  content: string
  metadata: {
    userId: string
    title: string
    type: string
    source?: string
    createdAt: string
  }
}

export async function addDocument(doc: KnowledgeDocument): Promise<void> {
  const col = await getCollection()

  await col.add({
    ids: [doc.id],
    documents: [doc.content],
    metadatas: [doc.metadata],
  })
}

export async function searchDocuments(
  query: string,
  userId: string,
  limit: number = 5
): Promise<KnowledgeDocument[]> {
  const col = await getCollection()

  const results = await col.query({
    queryTexts: [query],
    nResults: limit,
    where: { userId },
  })

  if (!results.ids[0] || results.ids[0].length === 0) {
    return []
  }

  return results.ids[0].map((id, index) => ({
    id,
    content: results.documents[0]?.[index] || '',
    metadata: (results.metadatas[0]?.[index] as KnowledgeDocument['metadata']) || {
      userId,
      title: '',
      type: 'text',
      createdAt: new Date().toISOString(),
    },
  }))
}

export async function deleteDocument(id: string): Promise<void> {
  const col = await getCollection()
  await col.delete({ ids: [id] })
}

export async function updateDocument(doc: KnowledgeDocument): Promise<void> {
  const col = await getCollection()

  await col.update({
    ids: [doc.id],
    documents: [doc.content],
    metadatas: [doc.metadata],
  })
}

export async function getDocumentById(id: string): Promise<KnowledgeDocument | null> {
  const col = await getCollection()

  const results = await col.get({
    ids: [id],
  })

  if (!results.ids || results.ids.length === 0) {
    return null
  }

  return {
    id: results.ids[0],
    content: results.documents[0] || '',
    metadata: (results.metadatas[0] as KnowledgeDocument['metadata']) || {
      userId: '',
      title: '',
      type: 'text',
      createdAt: new Date().toISOString(),
    },
  }
}
