import os
import base64
import io
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import vertexai
from vertexai.generative_models import GenerativeModel, Part, GenerationConfig, Content
from vertexai.generative_models import HarmCategory, HarmBlockThreshold

# --- Configuration ---
PROJECT_ID = "itd-ai-interns" # Replace with YOUR ACTUAL Google Cloud Project ID
REGION = "us-central1"
MODEL_NAME = "gemini-2.5-flash-preview-05-20" # Confirmed working model for the user

app = Flask(__name__)
CORS(app)

# --- Vertex AI Initialization ---
def initialize_vertex_ai():
    """Initialize Vertex AI with your project settings."""
    try:
        vertexai.init(project=PROJECT_ID, location=REGION)
        print(f"Vertex AI initialized for project: {PROJECT_ID}, region: {REGION}")
    except Exception as e:
        print(f"Error initializing Vertex AI: {e}")
        exit(1)

with app.app_context():
    initialize_vertex_ai()

def extract_text_from_pdf(pdf_binary_data):
    """
    Extracts text from PDF binary data using PyPDF2.
    """
    try:
        import PyPDF2
    except ImportError:
        print("ERROR: PyPDF2 is not installed or cannot be imported.")
        return None

    try:
        pdf_file_obj = io.BytesIO(pdf_binary_data)
        pdf_reader = PyPDF2.PdfReader(pdf_file_obj)
        text = ""
        for page_num in range(len(pdf_reader.pages)):
            page_obj = pdf_reader.pages[page_num]
            extracted_page_text = page_obj.extract_text()
            text += extracted_page_text or ""
        print(f"DEBUG: Extracted {len(text)} characters from PDF.")
        if not text.strip():
            print("DEBUG: Extracted text is empty or only whitespace.")
            return None
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

def fix_incomplete_json(json_string):
    """
    Attempts to fix incomplete JSON strings by adding missing closing braces/brackets and handling trailing commas.
    This is a heuristic and might not fix all malformed JSON, but improves robustness.
    """
    last_brace_index = json_string.rfind('}')
    last_bracket_index = json_string.rfind(']')
    
    # Try to find the last complete JSON structure
    truncated_string = json_string
    if last_brace_index != -1 or last_bracket_index != -1:
        if last_brace_index > last_bracket_index:
            truncated_string = json_string[:last_brace_index + 1]
        elif last_bracket_index > last_brace_index:
            truncated_string = json_string[:last_bracket_index + 1]
    
    stack = []
    fixed_string_chars = list(truncated_string)
    
    for char in truncated_string:
        if char == '{':
            stack.append('{')
        elif char == '[':
            stack.append('[')
        elif char == '}':
            if stack and stack[-1] == '{':
                stack.pop()
        elif char == ']':
            if stack and stack[-1] == '[':
                stack.pop()
    
    # Close any remaining open brackets/braces
    while stack:
        opener = stack.pop()
        if opener == '{':
            fixed_string_chars.append('}')
        elif opener == '[':
            fixed_string_chars.append(']')
            
    final_string = "".join(fixed_string_chars)

    # Clean up trailing commas if present before closing brace/bracket
    # This is a heuristic and might need adjustment for more complex cases
    final_string = final_string.strip()
    if final_string.endswith(',}'):
        final_string = final_string[:-2] + '}'
    if final_string.endswith(',]'):
        final_string = final_string[:-2] + ']'
    
    return final_string

# --- API Endpoint ---
@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap_endpoint():
    """
    Receives a prompt and data from the frontend, queries Vertex AI,
    and returns the generated roadmap/brief in JSON format.
    """
    try:
        data = request.get_json()
        user_prompt = data.get('prompt')
        prd_content_raw = data.get('prdContent')
        feedback_content = data.get('feedbackContent')
        is_prd_pdf = data.get('isPrdPdf', False)
        chat_history_raw = data.get('chatHistory', [])

        if not user_prompt:
            return jsonify({"error": "Prompt is required"}), 400
        if not prd_content_raw:
            return jsonify({"error": "PRD content is required"}), 400
        if not feedback_content:
            return jsonify({"error": "User feedback content is required"}), 400

        parsed_prd_content = ""
        if is_prd_pdf:
            try:
                pdf_binary_data = base64.b64decode(prd_content_raw)
                parsed_prd_content = extract_text_from_pdf(pdf_binary_data)
                if parsed_prd_content is None:
                    return jsonify({"error": "Failed to extract text from uploaded PDF. This often happens with image-only PDFs, encrypted PDFs, or corrupted files. Please try a text-searchable PDF or convert it to plain text/Markdown."}), 500
            except Exception as e:
                return jsonify({"error": f"Invalid Base64 PDF data or PDF parsing error: {e}. Ensure the PDF is not corrupted or encrypted."}), 400
        else:
            parsed_prd_content = prd_content_raw

        # UPDATED: Prompt to include the latest, more granular instructions for output types
        system_instruction = f"""
        You are an AI-powered Product Strategy Assistant. Your task is to analyze the provided Product Requirements Document (PRD) and recent user feedback to generate actionable insights that best respond to the user's request.

        Input Data:
        - PRD Strategic Direction and Features:
        {parsed_prd_content}

        - Summary of Recent User Feedback (including common requests, pain points, bugs):
        {feedback_content}

        User Request:
        {user_prompt}

        Instructions:
        - Carefully interpret the user's request to understand what kind of output they want. They may ask for:
            - A product roadmap with initiatives and prioritized features by quarter.
            - A detailed feature brief highlighting a specific feature (overview, problem, stories, justification).
            - A list of top bugs, pain points, or usability issues.
            - A strategic summary synthesizing PRD and feedback.
            - A prioritization recommendation (e.g., “what should we build next?”).
            - A sentiment or trend analysis.
            - Clarification of a vague or ambiguous requirement.
            - A direct answer to a custom or open-ended product strategy question.

        Rules:
        - Your response **MUST** be a single, complete, and valid JSON object.
        - DO NOT include any extra text, markdown, or explanations outside of the JSON object.
        - The JSON object **MUST** have a `type` field, which should be one of the following:
            - "roadmap"
            - "feature_brief"
            - "bug_list"
            - "strategic_summary"
            - "qa_response" (for open-ended or targeted product questions)

        ---

        ### 1. If `type` is `"roadmap"`:
        - Include a `"initiatives"` array:
            - Each initiative has: `"name"`, `"goal"`, `"features"` (array).
            - Each feature includes: `"name"`, `"priority"` (e.g., Highest, High, Medium, Low), `"quarter"` (e.g., Q3 2025), `"justification"`, and `"references"` (array of objects with {{"source"}} and {{"quote"}}).

        - **ALWAYS** include these three Mermaid syntax fields for visualization:
            - `"mermaid_gantt_syntax"`: A Gantt chart of initiatives/features by quarter.
            - `"mermaid_kanban_syntax"`: A Kanban board with Backlog → Done flow by priority.
            - `"mermaid_timeline_syntax"`: Timeline of major roadmap items by month or milestone.

        ---

        ### 2. If `type` is `"feature_brief"`:
        - Include:
            - `"feature_name"`
            - `"overview"`
            - `"problem_statement"`
            - `"user_stories"` (array of concise user stories)
            - `"justification"` (strategic value or urgency)
            - `"references"` (quotes from user feedback or PRD)

        ---

        ### 3. If `type` is `"bug_list"`:
        - Include:
            - `"bugs"` array
                - Each bug has: `"description"`, `"impact"`, `"frequency"` (if available), and `"references"` (quotes from feedback)

        ---

        ### 4. If `type` is `"strategic_summary"`:
        - Include:
            - `"summary"` (a synthesis of PRD goals, user sentiment, and strategic alignment)

        ---

        ### 5. If `type` is `"qa_response"`:
        - Use this when the user asks a specific question (e.g., "What’s the top requested feature?" or "Is dark mode important?").
        - Include:
            - `"answer"`: Direct, complete answer to the question.
            - `"evidence"`: Array of supporting items with {{"source"}} and {{"quote"}} or counts.
            - `"recommendation"`: Optional, action-oriented suggestion.

        ---

        Additional Notes:
        - Always reference both the PRD and feedback to generate answers.
        - Use plain, executive-friendly language suitable for product managers and stakeholders.
        - If the user's request is vague, generate the most strategically useful and balanced output.
        - Keep JSON clean and minimal — avoid empty fields or speculative filler content.

        ---

        Example JSON snippet for a comprehensive roadmap response (including all three mermaid syntaxes and multiple initiatives/features):

        {{
            "type": "roadmap",
            "initiatives": [
                {{
                    "name": "Enterprise Collaboration Suite Enhancement",
                    "goal": "Improve team communication and file sharing.",
                    "features": [
                        {{
                            "name": "Shared Team Calendars",
                            "priority": "High",
                            "quarter": "Q3 2025",
                            "justification": "Addresses critical user request for integrated scheduling.",
                            "references": [
                                {{"source": "App Store Review", "quote": "Shared calendars are absolutely essential for our team's workflow."}}
                            ]
                        }},
                        {{
                            "name": "Document Co-editing",
                            "priority": "High",
                            "quarter": "Q3 2025",
                            "justification": "Enables real-time collaboration as per PRD and user feedback.",
                            "references": [
                                {{"source": "Internal Slack", "quote": "The real-time co-editing is cool, but there's a noticeable lag sometimes."}}
                            ]
                        }}
                    ]
                }},
                {{
                    "name": "Core Platform Stability & Performance",
                    "goal": "Ensure a robust, reliable, and high-performing application.",
                    "features": [
                        {{
                            "name": "Login Bug Fix",
                            "priority": "Highest",
                            "quarter": "Q3 2025",
                            "justification": "Critical bug impacting user access and trust.",
                            "references": [
                                {{"source": "App Store Review", "quote": "Login bug is persistent! I have to reset my password almost daily."}}
                            ]
                        }},
                        {{
                            "name": "PDF Upload Stability",
                            "priority": "Highest",
                            "quarter": "Q3 2025",
                            "justification": "Frequent crashes during PDF uploads cause data loss.",
                            "references": [
                                {{"source": "App Store Review", "quote": "Crashes when I try to upload PDFs. Every. Single. Time."}}
                            ]
                        }}
                    ]
                }}
            ],
            "mermaid_gantt_syntax": "gantt\\n    dateFormat YYYY-MM-DD\\n    title Product Roadmap Q3 2025\\n    section Collab Enhance\\n    Shared Team Calendars :active, 2025-07-01, 30d\\n    Document Co-editing :2025-07-15, 45d\\n    section Stability\\n    Login Bug Fix :crit1, 2025-07-05, 15d\\n    PDF Upload Stability :crit2, after crit1, 20d",
            "mermaid_kanban_syntax": "graph TD\\n    subgraph Highest Priority\\n        A[Login Bug Fix (Stability)]\\n        B[PDF Upload Stability (Stability)]\\n    end\\n    subgraph High Priority\\n        C[Shared Team Calendars (Collab Enhance)]\\n        D[Document Co-editing (Collab Enhance)]\\n    end\\n    Highest Priority --> High Priority",
            "mermaid_timeline_syntax": "timeline\\n    title Q3 2025 Key Initiatives\\n    section July 2025\\n        Login Bug Fix : 2025-07-05\\n        Shared Team Calendars : 2025-07-01\\n    section August 2025\\n        PDF Upload Stability : 2025-08-01\\n        Document Co-editing : 2025-08-15"
        }}
        """

        contents = [Content(role="user", parts=[Part.from_text(system_instruction)])]

        for message in chat_history_raw:
            if message['role'] in ['user', 'ai'] and message['content'] and not str(message['content']).startswith("Error:"):
                vertex_role = "user" if message['role'] == "user" else "model"
                content_to_add = json.dumps(message['content']) if isinstance(message['content'], dict) or isinstance(message['content'], list) else message['content']
                contents.append(Content(role=vertex_role, parts=[Part.from_text(content_to_add)]))

        # IMPORTANT: The user_prompt from the request is now part of the system_instruction.
        # This line below needs to be adjusted if user_prompt is *only* meant to be in the system instruction.
        # However, typically the user's *latest* prompt is also sent as a final message.
        # Let's assume the user_prompt in the system_instruction is for instructing the AI generally
        # and the `user_prompt` from the request body is the actual, current user query.
        # So, keeping this line as it adds the *specific* user request from the frontend.
        contents.append(Content(role="user", parts=[Part.from_text(f"User Prompt: {user_prompt}")]))


        model = GenerativeModel(MODEL_NAME)
        generation_config = GenerationConfig(
            temperature=0.7,
            max_output_tokens=8192,
            response_mime_type="application/json"
        )
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }

        response = model.generate_content(
            contents,
            generation_config=generation_config,
            safety_settings=safety_settings
        )

        generated_text = response.text
        
        parsed_response = None
        try:
            parsed_response = json.loads(generated_text)
        except json.JSONDecodeError as e:
            print(f"WARNING: Initial JSON parsing failed: {e}. Raw: {generated_text}. Attempting to fix...")
            fixed_text = fix_incomplete_json(generated_text)
            try:
                parsed_response = json.loads(fixed_text)
                print("DEBUG: Successfully parsed JSON after attempting to fix.")
            except json.JSONDecodeError as e_fixed:
                print(f"ERROR: JSON parsing failed even after attempting to fix: {e_fixed}. Final attempt raw: {fixed_text}")
                return jsonify({"error": "AI did not return valid JSON. Please try rephrasing your prompt or reducing complexity.", "raw_response": generated_text}), 500

        if parsed_response:
            return jsonify({"roadmap": parsed_response}) # Note: The key is "roadmap" here, but the JSON type can be other things. Consider renaming for clarity to "response_data" or similar on the client-side.
        else:
            return jsonify({"error": "AI response was empty or could not be processed."}), 500

    except Exception as e:
        print(f"Error in /generate-roadmap: {e}")
        if "google.api_core.exceptions" in str(e) and "404" in str(e):
             return jsonify({"error": "Vertex AI model not found or project access denied. Please check your Project ID, Region, Model Name, and permissions. Current model: " + MODEL_NAME}), 500
        if "Candidate was blocked due to safety reasons" in str(e) or "safety_ratings" in str(e):
            return jsonify({"error": "AI response was blocked by safety filters. Please try rephrasing your prompt or input data."}), 500
        if "finish_reason=MAX_TOKENS" in str(e):
            return jsonify({"error": "AI response exceeded maximum token limit. Please try a more concise prompt or reduce input data size."}), 500
        return jsonify({"error": str(e)}), 500

# --- Run the Flask App ---
if __name__ == '__main__':
    print("Attempting to start Flask app...")
    try:
        app.run(debug=True, port=5000)
    except OSError as e:
        print(f"ERROR: Could not start Flask app. Port 5000 might be in use or another network issue occurred: {e}")
        print("Please ensure no other applications are using port 5000.")
        print("You can try changing the port in app.run(port=XXXX) or kill the process using port 5000.")
    except Exception as e:
        print(f"An unexpected error occurred during Flask app startup: {e}")