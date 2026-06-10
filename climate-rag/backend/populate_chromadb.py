import os
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# Path to knowledge folder
knowledge_path = "backend/knowledge"

# Load all .txt files
docs = []
for fname in os.listdir(knowledge_path):
    if fname.endswith(".txt"):
        with open(os.path.join(knowledge_path, fname), "r") as f:
            docs.append(f.read())

# Split into chunks
splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = []
for doc in docs:
    chunks.extend(splitter.split_text(doc))

# Create embeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

# Populate ChromaDB
db = Chroma.from_texts(chunks, embeddings, persist_directory="backend/chroma_db")
db.persist()

print("✅ ChromaDB populated with climate safety knowledge!")
