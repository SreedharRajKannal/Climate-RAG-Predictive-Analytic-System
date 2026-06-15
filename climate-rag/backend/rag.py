import os
import chromadb
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

OLLAMA_HOST  = os.getenv("OLLAMA_HOST", "http://localhost:11434")
CHROMA_PATH  = "./chroma_store"
COLLECTION   = "climate_knowledge"

sentence_ef = SentenceTransformerEmbeddingFunction(
    model_name = "all-MiniLM-L6-v2"
)

chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection    = chroma_client.get_or_create_collection(
    name               = COLLECTION,
    embedding_function = sentence_ef
)

llm = Ollama(
    model    = os.getenv("OLLAMA_MODEL", "llama3"),
    base_url = OLLAMA_HOST
)

prompt_template = PromptTemplate(
    input_variables=["conditions", "context"],
    template="""
You are a climate advisory assistant. Based on the current weather conditions and safety guidelines below, write a short plain-language advisory for the user.

Current conditions:
{conditions}

Relevant safety guidelines:
{context}

Rules:
- Keep it under 4 sentences
- Start with a severity level: Informational, Caution, Warning, or Critical
- Be direct, no fluff
- Focus on what the user should actually do

Advisory:
"""
)

chain = prompt_template | llm


def format_conditions(reading) -> str:
    return f"""
Temperature   : {reading.temperature}°C
Feels like    : {reading.feels_like}°C
Humidity      : {reading.humidity}%
Wind speed    : {reading.wind_speed} km/h
UV index      : {reading.uv_index}
Rain prob     : {reading.precip_prob}%
Cloud cover   : {reading.cloud_cover}%
AQI           : {reading.aqi if reading.aqi else 'N/A'}
""".strip()


def retrieve_context(conditions_text: str) -> tuple:
    results = collection.query(
        query_texts = [conditions_text],
        n_results   = 3
    )
    chunks = results["documents"][0]
    ids = results["ids"][0]
    
    retrieved_chunks = []
    for doc_id, chunk in zip(ids, chunks):
        # IDs are stored as "{filename}_{index}", so rsplit extracts filename
        source_file = doc_id.rsplit('_', 1)[0]
        excerpt = chunk[:80].replace("\n", " ") + "..."
        retrieved_chunks.append({
            "source": source_file,
            "excerpt": excerpt
        })
        
    return "\n\n".join(chunks), retrieved_chunks


def generate_advisory(reading) -> dict:
    conditions_text = format_conditions(reading)
    context, retrieved_chunks = retrieve_context(conditions_text)

    try:
        response = chain.invoke({
            "conditions": conditions_text,
            "context":    context
        })
        advisory_text = response.strip()
    except Exception as e:
        print(f"RAG LLM error: {e}. Falling back to rule-based advisory.")
        # Simple rule-based advisory fallback
        if reading.temperature and reading.temperature >= 40.0:
            advisory_text = "Critical: Extreme temperature detected. Avoid outdoor exposure, seek air conditioning, and stay hydrated."
        elif reading.feels_like and reading.feels_like >= 42.0:
            advisory_text = "Critical: Extremely high heat index. Stay indoors and drink plenty of fluids to avoid heat stroke."
        elif reading.uv_index and reading.uv_index >= 8.0:
            advisory_text = "Warning: Very high UV index. Minimize sun exposure between 10am and 4pm. Wear protective clothing and SPF 50+."
        elif reading.precip_prob and reading.precip_prob >= 80.0:
            advisory_text = "Warning: Rain probability is extremely high. Keep an umbrella handy and stay clear of flood-prone areas."
        elif reading.humidity and reading.humidity >= 90.0:
            advisory_text = "Caution: Very high humidity makes heat feel more intense. Dress lightly and limit physical activities."
        else:
            advisory_text = "Informational: Weather conditions are stable and within safety thresholds. No special actions required."

    if "Critical" in advisory_text:
        severity = "Critical"
    elif "Warning" in advisory_text:
        severity = "Warning"
    elif "Caution" in advisory_text:
        severity = "Caution"
    else:
        severity = "Informational"

    return {
        "advisory": advisory_text,
        "severity": severity,
        "conditions": conditions_text,
        "retrieved_chunks": retrieved_chunks
    }


def load_knowledge_base(folder: str = "./knowledge"):
    import os
    files = [f for f in os.listdir(folder) if f.endswith(".txt")]

    for filename in files:
        filepath = os.path.join(folder, filename)
        with open(filepath, "r") as f:
            text = f.read()

        chunks = [text[i:i+500] for i in range(0, len(text), 500)]

        collection.add(
            documents = chunks,
            ids       = [f"{filename}_{i}" for i in range(len(chunks))]
        )
        print(f"Loaded: {filename} ({len(chunks)} chunks)")