import os
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

# Path to knowledge folder
knowledge_path = os.path.join(os.path.dirname(__file__), "knowledge")

# Load all .txt files
docs = []
for fname in os.listdir(knowledge_path):
    if fname.endswith(".txt"):
        with open(os.path.join(knowledge_path, fname), "r", encoding="utf-8") as f:
            docs.append(f.read())

# Split into chunks
splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = []
for doc in docs:
    chunks.extend(splitter.split_text(doc))

# ✅ Use Sentence‑Transformers model
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Populate ChromaDB
persist_dir = os.path.join(os.path.dirname(__file__), "chroma_db")
db = Chroma.from_texts(chunks, embeddings, persist_directory=persist_dir)
db.persist()

print(f"✅ ChromaDB populated with Sentence‑Transformers embeddings at {persist_dir}!")
