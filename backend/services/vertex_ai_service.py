
import json
import vertexai
from vertexai.generative_models import GenerativeModel, Part, GenerationConfig, Content
from vertexai.generative_models import HarmCategory, HarmBlockThreshold

from config import PROJECT_ID, REGION, MODEL_NAME
from utils.json_utils import fix_incomplete_json

def initialize_vertex_ai_service():
    try:
        vertexai.init(project=PROJECT_ID, location=REGION)
        print(f"Vertex AI Service initialized for project: {PROJECT_ID}, region: {REGION}")
    except Exception as e:
        print(f"Error initializing Vertex AI Service: {e}")
        raise 


SAFETY_SETTINGS_RELAXED = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

def generate_content_with_ai(prompt_text, generation_config, safety_settings=SAFETY_SETTINGS_RELAXED, chat_history=None):
    """
    Helper function to interact with the Vertex AI GenerativeModel.
    Includes robust error handling and JSON parsing/fixing.
    """
    model = GenerativeModel(MODEL_NAME)
    contents = []

    if chat_history:
        for message in chat_history:
            if message['role'] in ['user', 'ai'] and message['content'] and not str(message['content']).startswith("Error:"):
                vertex_role = "user" if message['role'] == "user" else "model"
                content_to_add = json.dumps(message['content']) if isinstance(message['content'], dict) or isinstance(message['content'], list) else message['content']
                contents.append(Content(role=vertex_role, parts=[Part.from_text(content_to_add)]))
    
    contents.append(Content(role="user", parts=[Part.from_text(prompt_text)]))

    try:
        response = model.generate_content(
            contents,
            generation_config=generation_config,
            safety_settings=safety_settings
        )

        print(f"\n--- RAW AI RESPONSE OBJECT for prompt (first 100 chars): {prompt_text[:100]} ---")
        print(response) 
        print("--- END RAW AI RESPONSE OBJECT ---\n")

        if not response.candidates or not response.candidates[0].content.parts:
            print("WARNING: AI response has no candidates or no content parts (empty response or blocked).")
            return None 
        
        generated_text = response.text
        print(f"\n--- RAW AI RESPONSE TEXT for prompt (first 100 chars): {prompt_text[:100]} ---")
        print(generated_text)
        print("--- END RAW AI RESPONSE TEXT ---\n")

        parsed_result = None
        try:
            parsed_result = json.loads(generated_text)
        except json.JSONDecodeError as e:
            print(f"WARNING: JSON parsing failed: {e}. Raw: {generated_text}. Attempting to fix...")
            fixed_text = fix_incomplete_json(generated_text)
            try:
                parsed_result = json.loads(fixed_text)
                print("DEBUG: Successfully parsed JSON after attempting to fix.")
            except json.JSONDecodeError as e_fixed:
                print(f"ERROR: JSON parsing failed even after fixing: {e_fixed}. Final attempt raw: {fixed_text}")
                return None 
        
        return parsed_result

    except Exception as e:
        print(f"ERROR: Exception during AI content generation: {e}")
        
        if "google.api_core.exceptions" in str(e):
            if "404" in str(e):
                raise ValueError("Vertex AI model not found or project access denied. Check Project ID, Region, Model Name, and permissions.") from e
            elif "Candidate was blocked" in str(e) or "safety_ratings" in str(e):
                raise ValueError("AI response was blocked by safety filters. Please try rephrasing your input.") from e
            elif "finish_reason=MAX_TOKENS" in str(e):
                raise ValueError("AI response exceeded maximum token limit. Please try more concise input.") from e
            else:
                raise ValueError(f"Vertex AI API error: {str(e)}") from e
        raise 
