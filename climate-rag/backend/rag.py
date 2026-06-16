import os
import re
import json
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
    model    = os.getenv("OLLAMA_MODEL", "tinyllama"),
    base_url = OLLAMA_HOST,
    temperature = 0.1
)

prompt_template = PromptTemplate(
    input_variables=["conditions", "context", "computed_risk"],
    template="""
You are a highly advanced AI Climate Intelligence system. Based on the current weather conditions and the historical/safety guidelines retrieved below, analyze the situation and generate a structured JSON response. 

CRITICAL CONSTRAINT: The deterministic risk level for these conditions has been pre-computed as "{computed_risk}". You MUST set the "risk_level" field exactly to "{computed_risk}" in your JSON output. Do not invent your own risk level. Ensure your narrative and impact explanations align logically with a "{computed_risk}" risk level.

Current conditions:
{conditions}

Retrieved Context:
{context}

You MUST output ONLY valid JSON using exactly this structure, with no markdown formatting or extra text outside the JSON block.

{{
  "summary": "Short narrative of what the user should expect (e.g., 'Rain probability increases sharply after sunset.')",
  "peak_window": "Time range of major impact (e.g., '8 PM - 11 PM' or 'All Day')",
  "intensity": "Expected intensity of the primary condition (e.g., 'Moderate', 'Severe')",
  "risk_level": "Low, Moderate, High, or Severe",
  "confidence_score": 92,
  "confidence_breakdown": {{
    "historical_match": 95,
    "data_quality": 89,
    "forecast_agreement": 91
  }},
  "potential_impact": "Disruptions, health warnings, or impacts (e.g., 'Evening travel disruptions possible.')"
}}

Generate the JSON now:
"""
)

chain = prompt_template | llm

def extract_json_from_text(text: str) -> dict:
    """Robustly extract and parse JSON from the LLM output."""
    # 1. Try direct parsing
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # 2. Try extracting from markdown code blocks
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
            
    # 3. Try to find anything that looks like a JSON object
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
            
    raise ValueError("Could not extract valid JSON from LLM response.")

def validate_advisory_json(data: dict) -> dict:
    """Ensure the parsed JSON has all required fields."""
    required_keys = [
        "summary", "peak_window", "intensity", "risk_level", 
        "confidence_score", "potential_impact"
    ]
    for key in required_keys:
        if key not in data:
            data[key] = "Not available"
            
    if "confidence_breakdown" not in data:
        data["confidence_breakdown"] = {
            "historical_match": data.get("confidence_score", 90),
            "data_quality": 95,
            "forecast_agreement": 88
        }
    return data

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
    try:
        results = collection.query(
            query_texts = [conditions_text],
            n_results   = 3
        )
        if not results or not results["documents"] or not results["documents"][0]:
            return "No relevant historical context found.", []
            
        chunks = results["documents"][0]
        ids = results["ids"][0]
        
        retrieved_chunks = []
        for doc_id, chunk in zip(ids, chunks):
            source_file = doc_id.rsplit('_', 1)[0]
            excerpt = chunk[:80].replace("\n", " ") + "..."
            retrieved_chunks.append({
                "source": source_file,
                "excerpt": excerpt,
                "text": chunk
            })
            
        return "\n\n".join(chunks), retrieved_chunks
    except Exception as e:
        print(f"Error retrieving from ChromaDB: {e}")
        return "No relevant historical context found.", []


def get_fallback_advisory(reading) -> dict:
    """Rule-based fallback if the LLM or parser completely fails."""
    risk_level = "Low"
    summary = "Weather conditions are stable and within safety thresholds."
    peak = "None"
    intensity = "Light"
    impact = "No special actions required."
    
    if reading.temperature and reading.temperature >= 40.0:
        risk_level = "Severe"
        summary = "Extreme temperature detected."
        intensity = "Severe Heat"
        impact = "Avoid outdoor exposure, seek air conditioning, and stay hydrated."
    elif reading.feels_like and reading.feels_like >= 42.0:
        risk_level = "Severe"
        summary = "Extremely high heat index."
        intensity = "Severe Heat"
        impact = "Stay indoors and drink plenty of fluids to avoid heat stroke."
    elif reading.uv_index and reading.uv_index >= 8.0:
        risk_level = "High"
        summary = "Very high UV index."
        peak = "10 AM - 4 PM"
        intensity = "High UV"
        impact = "Minimize sun exposure. Wear protective clothing and SPF 50+."
    elif reading.precip_prob and reading.precip_prob >= 80.0:
        risk_level = "High"
        summary = "Rain probability is extremely high."
        intensity = "Heavy Rain"
        impact = "Keep an umbrella handy and stay clear of flood-prone areas."
    elif reading.humidity and reading.humidity >= 90.0:
        risk_level = "Moderate"
        summary = "Very high humidity makes heat feel more intense."
        intensity = "High Humidity"
        impact = "Dress lightly and limit physical activities."
        
    return {
        "summary": summary,
        "peak_window": peak,
        "intensity": intensity,
        "risk_level": risk_level,
        "confidence_score": 95,
        "confidence_breakdown": {
            "historical_match": 100,
            "data_quality": 100,
            "forecast_agreement": 85
        },
        "potential_impact": impact
    }

def compute_risk_level(reading) -> str:
    risk = "Low"
    if reading.precip_prob and reading.precip_prob >= 70.0:
        risk = "Moderate"
    if reading.precip_prob and reading.precip_prob >= 90.0:
        risk = "High"
    if reading.uv_index and reading.uv_index >= 8.0:
        risk = "High"
    if reading.aqi and reading.aqi >= 150:
        risk = "High"
    
    # Heat overrides others if more severe
    if reading.feels_like and reading.feels_like >= 37.0:
        risk = "Moderate" if risk == "Low" else risk
    if reading.feels_like and reading.feels_like >= 42.0:
        risk = "High"
    if reading.feels_like and reading.feels_like >= 48.0:
        risk = "Severe"
        
    return risk

def generate_advisory(reading) -> dict:
    conditions_text = format_conditions(reading)
    context, retrieved_chunks = retrieve_context(conditions_text)
    computed_risk = compute_risk_level(reading)

    try:
        response_text = chain.invoke({
            "conditions": conditions_text,
            "context":    context,
            "computed_risk": computed_risk
        })
        
        parsed_json = extract_json_from_text(response_text)
        advisory_data = validate_advisory_json(parsed_json)
        
    except Exception as e:
        print(f"RAG LLM or Parsing error: {e}. Falling back to rule-based advisory.")
        advisory_data = get_fallback_advisory(reading)

    return {
        "advisory": advisory_data,
        "severity": advisory_data.get("risk_level", "Low"),
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