import os
import chromadb
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
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

chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection    = chroma_client.get_or_create_collection(
    name               = COLLECTION,
    embedding_function = openai_ef
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

chain = LLMChain(llm=llm, prompt=prompt_template)


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


def retrieve_context(conditions_text: str) -> str:
    results = collection.query(
        query_texts = [conditions_text],
        n_results   = 3
    )
    chunks = results["documents"][0]
    return "\n\n".join(chunks)


def generate_advisory(reading) -> dict:
    conditions_text = format_conditions(reading)
    context         = retrieve_context(conditions_text)

    response = chain.invoke({
        "conditions": conditions_text,
        "context":    context
    })

    advisory_text = response["text"].strip()

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
        "conditions": conditions_text
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