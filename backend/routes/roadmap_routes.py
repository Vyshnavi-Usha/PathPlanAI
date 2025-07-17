from flask import Blueprint, request, jsonify
import json
from services.vertex_ai_service import generate_content_with_ai, SAFETY_SETTINGS_RELAXED
from vertexai.generative_models import GenerationConfig
from datetime import datetime, timedelta

roadmap_bp = Blueprint('roadmap_routes', __name__)
_document_store_ref = {}

@roadmap_bp.route('/generate-roadmap', methods=['POST'])
def generate_roadmap_endpoint():
    global _document_store_ref

    try:
        data = request.get_json()
        user_prompt = data.get('prompt', '').strip()
        chat_history_raw = data.get('chatHistory', [])

        if not user_prompt:
            return jsonify({"error": "Prompt is required"}), 400

        
        if user_prompt.lower() in {"hi", "hello", "hey", "yo", "sup"}:
            return jsonify({
                "roadmap": { 
                    "type": "qa_response",
                    "overview_text": "Hi there! 👋 I’m your AI Product Strategy Assistant. You can ask me to create a roadmap, summarize feedback, suggest next features, or even prioritize using frameworks like RICE or MoSCoW.",
                    "answer": "Hi there! 👋 I’m your AI Product Strategy Assistant. You can ask me to create a roadmap, summarize feedback, suggest next features, or even prioritize using frameworks like RICE or MoSCoW.",
                    "evidence": [],
                    "recommendation": "Try asking something like: 'What should we build next?' or 'Create a roadmap for Q4 2025.'"
                }
            })

        prd_content_raw = _document_store_ref.get("prd_content")
        feedback_content = _document_store_ref.get("feedback_content")

        if prd_content_raw is None or feedback_content is None:
            return jsonify({"error": "PRD and/or User Feedback content not found in backend store. Please upload documents first via /initial-analysis."}), 400

        current_date = datetime.now()
        current_quarter_num = (current_date.month - 1) // 3 + 1
        current_quarter_year = current_date.year
        current_quarter = f"Q{current_quarter_num} {current_quarter_year}"

       
        next_quarter_month = (current_quarter_num * 3 % 12) + 1
        next_quarter_year = current_quarter_year
        if next_quarter_month == 1: 
            next_quarter_year += 1
        next_quarter_start = datetime(next_quarter_year, next_quarter_month, 1)
        next_quarter_num = (next_quarter_start.month - 1) // 3 + 1
        next_quarter = f"Q{next_quarter_num} {next_quarter_year}"

        
        product_name = "Your AI-Powered Collaboration Platform" 


       
        system_instruction = f"""
        You are an AI-powered Product Strategy Assistant. Your primary goal is to provide helpful, strategic responses based on the provided Product Requirements Document (PRD) and recent user feedback.

        First, **CAREFULLY ANALYZE THE USER'S PROMPT TO DETERMINE THEIR EXPLICIT INTENT.**

        **PRIORITIZATION FOR INTENT CLASSIFICATION:**
        1. If the user explicitly asks for "bug fixes", "bugs list", or "top bugs", the intent is "bug_list".
        2. If the user explicitly asks for a "feature brief", "details on a feature", or "brief for [feature name]", the intent is "feature_brief".
        3. If the user asks for a "roadmap", "plan for QX", "next quarter's initiatives", the intent is "roadmap".
        4. If the user asks for a "strategic summary", "overall strategy", or "high-level goals", the intent is "strategic_summary".
        5. For all other general questions, greetings, or unclear requests, the intent is "qa_response".

        **CRITICAL RULE:** If the user's prompt clearly matches one of the explicit intent keywords (e.g., "bug fixes", "feature brief", "roadmap", "strategic summary"), **YOU MUST generate that specific JSON 'type' and its associated structured data.** Do not default to 'qa_response' or 'roadmap' if another type is explicitly requested and better fits.

        **ANALYZE THE USER'S PROMPT FOR MULTIPLE REQUESTS:**
        - Users may ask for multiple things: "List top 5 bugs AND create a roadmap that addresses them"
        - Users may ask for combined analysis: "What bugs should we fix in Q4 roadmap?"
        - Users may ask sequential questions: "Show me bugs, then roadmap to fix them"

        **RESPONSE STRATEGY FOR MULTI-INTENT REQUESTS:**
        1. If the user asks for MULTIPLE distinct things (e.g., "bugs AND roadmap"), determine the **primary** requested type (e.g., if they end with 'roadmap', then it's 'roadmap').
        2. Generate the **primary type's JSON structure**.
        3. **Integrate the secondary analysis/information into the `overview_text` of the primary type.**
        4. Ensure the structured data (e.g., 'features' in a roadmap) *explicitly* addresses and incorporates the secondary information (e.g., specific bug fixes within a 'stability' initiative).
        
        **ANALYZE USER'S SPECIFIC REQUIREMENTS:**

 **Document Source Requirements:**
   - If user says "only PRD" / "based on PRD" / "PRD only" → Use ONLY PRD Strategic Direction, ignore user feedback
   - If user says "only user feedback" / "based on feedback" / "user requests only" → Use ONLY User Feedback, ignore PRD
   - If user says "only tech debt" → Focus on technical improvements, use both docs for context but generate tech-focused features
   - Otherwise → Use both PRD and User Feedback (default behavior)

        **SPECIAL HANDLING FOR "bugs AND roadmap" requests:**
        - **Primary type:** "roadmap"
        - **Include bug analysis in the `overview_text` under a "## Key Issues Identified" section.** This should list the top bugs.
        - **Reference specific bugs in feature justifications** within the `initiatives` array.
        - **Ensure the roadmap actually addresses the identified issues** by including initiatives/features focused on these bug fixes (e.g., a "Stability Initiative").

        For ALL responses, include a natural language 'overview_text' that summarizes the main points or directly answers the user's question. This text should be well-formatted using markdown.

        ### Current Context:
        - Current Date: {current_date.strftime('%Y-%m-%d')}
        - Current Quarter: {current_quarter}
        - Next Quarter: {next_quarter}
        - Product Name: {product_name}

        ### Input Data:
        - PRD Strategic Direction:
        {prd_content_raw}

        - User Feedback Summary:
        {feedback_content}

        ### User Request:
        {user_prompt}

        ### Instructions for JSON Generation:
        - Always return a valid JSON object. The top-level object MUST contain:
            - "type": (string) with one of these values: "roadmap", "feature_brief", "bug_list", "strategic_summary", "qa_response".
            - "overview_text": (string) A comprehensive natural language answer or summary relevant to the user's prompt. This text should be well-formatted using markdown.

        - If 'type' is "roadmap":
            - The JSON object MUST **always** include an **"initiatives" array**. This array **MUST NOT be empty** and should be populated with detailed initiative objects as per the schema.
            - Each initiative object MUST contain "name", "goal", and a "features" array.
            - Each feature object within an initiative's "features" array MUST contain "name", "priority", "quarter", "justification", "startDate", "endDate", "status", "assignee", "progress", and "references".
            - **Special Instruction for Effort Allocation (if requested):**
                - If the user specifies effort allocation (e.g., "60% PRD, 30% user requests, 10% tech debt"), interpret this as a guide for the *proportion and focus* of the features generated.
                - **60% PRD Strategy:** Generate the majority of features (e.g., 60% of the total number of features or features representing significant scope) directly from the `PRD Strategic Direction`, ensuring they align with the core product vision and goals. These should typically be 'Highest' or 'High' priority.
                - **30% Top User Requests:** Generate a substantial portion of features (e.g., 30% of total features) directly addressing the most frequent or impactful pain points and requests from the `User Feedback Summary`. These should typically be 'High' or 'Medium' priority.
                - **10% Tech Debt:** Include a smaller set of features (e.g., 10% of total features) that represent technical improvements, refactoring, or performance enhancements. These might not be explicitly in PRD or feedback but are necessary for product health. Invent plausible tech debt items if the input documents don't explicitly list them, and assign them 'Medium' or 'Low' priority.
                - Remember that they can ask for any proportion not just 60%PRD, 30%user requests and 10%tech debt, the proportion can be any , you shd generate accordingly.
                - Ensure the **total number of features is reasonable** for the requested quarter (e.g., 6-10 features for a single quarter, broken down across initiatives).
                - **The `justification` for each feature MUST explicitly refer to "PRD strategy", "user feedback", or "tech debt" to align with the allocation.**
             **Effort Allocation Requirements:**
                - If user specifies percentages (e.g., "60% PRD, 30% user requests, 10% tech debt") → Include "## Effort Allocation Breakdown" section in overview_text
                - If user specifies simple allocation (e.g., "balanced", "equal priority") → Include brief allocation explanation
                - If no allocation mentioned → Do NOT include effort allocation sections
            
            - **Crucially for 'overview_text' (Concise Roadmap Summary):** This text MUST provide a **high-level, strategic summary** of the generated roadmap. It should be concise and avoid repeating the detailed feature descriptions found within the `initiatives` array. Structure this overview using markdown headings (`##`) for the following sections and provide brief, strategic content for each. If integrating bug fixes, add a "## Key Issues Identified" section.

                ## Introduction / Overview
                - Purpose of this roadmap (e.g., Q:{{Quarter}} {{Year}} roadmap for {{Product Name}}).
                - Brief summary of the product (e.g., what {{Product Name}} is and what it aims to do).
                 
                - ## PRD Strategy Focus ← Only if "PRD only" requested
                - ## User Feedback Focus ← Only if "user feedback only" requested 

                ## Product Vision & Goals
                - High-level vision that this roadmap supports.
                - Key business objectives or high-level goals this roadmap aims to achieve (e.g., increasing retention, improving engagement, reducing support tickets). Reference PRD goals directly.
                
                ## Strategic Themes / Focus Areas
                - Describe the main strategic themes or top-level initiatives guiding development for this period. Elaborate on their purpose.

                ## Key Issues Identified (if applicable, e.g., for bug fixes)
                - List the identified top bugs/issues based on user feedback that the roadmap will address.

                ## Planned Features & Improvements
                - For each strategic theme, list the prioritized features/enhancements. Briefly describe each feature and provide the reasoning behind its priority, explicitly referencing user feedback or PRD insights (similar to the justification in the structured feature data). Use bullet points for features under each theme.

                ## High-Level Timelines & Milestones
                - Provide a strategic schedule for key deliverables, major phases, or release milestones within the roadmap period. Do not include exact dates for individual features here; keep it high-level (e.g., "Early QX: Foundational work," "Mid QX: Key feature launches," "End QX: Release candidate/UAT").

                ## Resource Allocation / Team Focus
                - Describe how different teams (Frontend, Backend, Mobile, QA, Design, etc., as identified for features) will be primarily focused on different aspects of this roadmap, emphasizing parallel work streams.

                - ## Effort Allocation Breakdown ← Only if percentages specified 

                ## Risks & Potential Challenges
                - Identify potential high-level risks or challenges for executing this roadmap (e.g., technical complexities, resource constraints, unexpected feedback).
                - Briefly outline potential mitigation strategies. *If no explicit risks are found in PRD/feedback, invent plausible, generic product development risks and mitigations.*

                ## Success Metrics
                - Define how the success of this roadmap will be tracked and measured for the overarching goals. Be specific with KPIs if possible (e.g., "Increase DAU by X%", "Decrease support tickets by Y%"). Reference PRD if KPIs are defined there.

                ## Future Outlook / Next Steps
                - Conclude with a brief forward-looking statement about what the successful completion of this roadmap enables for future quarters or the product's long-term vision.

            - **IMPORTANT for Roadmap Dates and Scheduling:**
                - If the user requests a roadmap for a specific duration (e.g., '6 months', 'next two quarters', 'Q4 2025'), ensure the generated 'startDate' and 'endDate' fields for features accurately span the *entire* requested duration, relative to the Current Date provided above.
                - Features should have **varying durations** based on their implied scope or complexity, *not* all be the same length. Avoid assigning an entire quarter's duration to a single task unless it represents a massive, singular effort that genuinely spans that entire period. Break down larger efforts into smaller, more granular features if possible within the quarter.
                - **Prioritize task scheduling:** 'Highest' and 'High' priority features should generally be scheduled to start earlier and/or complete within the beginning of the relevant quarter. 'Medium' and 'Low' priority features should follow logically. Consider dependencies if implied.
                - **Assignee Variation & Parallel Work:** Identify and assign features to **different, plausible teams or individuals** (e.g., "Frontend Team", "Backend Team", "Mobile Team", "QA Team", "Design Team", "Product Team"). **Tasks assigned to different teams can and should overlap in their timelines (run concurrently)**, reflecting parallel development efforts. Avoid making all tasks sequential if different assignees are involved.
                - **Status Mapping for Kanban:** For the "status" field, *always* use one of the following exact values: "To Do", "In Progress", "Review", "Done", "On Hold". For newly suggested features, "To Do" is generally appropriate.
                - Invent plausible features and timelines if necessary to meet the requested duration, grounding them in the overall PRD and feedback themes.

        - If 'type' is "feature_brief":
            - The JSON object MUST include "name", "description", "problem_statement", "user_stories", "status" (optional), and "references" (optional).
            - Ensure "overview_text" summarizes the feature brief,**without repeating the detailed content found in 'description', 'problem_statement', or 'user_stories'**.
            - For 'feature_brief' type responses, ensure 'description,' 'problem_statement,' and 'user_stories' are comprehensive and detailed, extracting all relevant information from the PRD and user feedback. Include multiple relevant user stories if applicable.

        - If 'type' is "bug_list":
            - The JSON object MUST include a "bugs" array with "description", "impact", "frequency" (optional), and "references" (optional).
            - Ensure "overview_text" summarizes the bug list.
            - For 'bug_list' type, analyze the 'User Feedback Summary' to identify distinct bugs, their impact (e.g., 'critical', 'high', 'medium', 'low'), and frequency (e.g., 'frequent', 'rare'). If a specific number or prioritization (e.g., 'top 5', 'most impactful') is requested, select and list only those, ordering by impact.

        - If 'type' is "strategic_summary":
            - The JSON object MUST include a "summary" field.
            - The "overview_text" should be the summary itself. Synthesize key themes, objectives, and competitive positioning directly from the `PRD Strategic Direction`.

        - If 'type' is "qa_response" (for any other/ generic/unclear questions):
            - The JSON object MUST include an "answer" field (same as "overview_text"), and optional "evidence", "recommendation" fields.
            - The "overview_text" should be the answer itself.
            - When asked for specific sections of the PRD, summarize their content concisely into the 'overview_text' (and 'answer' field). Avoid repeating information or creating redundant structured fields (like 'problem_statement', 'feature_name') if the query is a simple request for explanation of a section.

        - Your JSON **must** contain only the structured object. No prose or markdown outside of string values within the JSON.
        - Do NOT include `mermaid_gantt_syntax`, `mermaid_kanban_syntax`, or `mermaid_timeline_syntax` in the JSON response.
        - Keep output clean, strategic, and grounded in source material. Avoid hallucinations.
        """

       
        generation_config = GenerationConfig(
            temperature=0.7,
            max_output_tokens=8192,
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "type": {"type": "STRING", "enum": ["roadmap", "feature_brief", "bug_list", "strategic_summary", "qa_response"]},
                    "overview_text": {"type": "STRING"},

                    "initiatives": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "name": {"type": "STRING"},
                                "goal": {"type": "STRING"},
                                "features": {
                                    "type": "ARRAY",
                                    "items": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "name": {"type": "STRING"},
                                            "priority": {"type": "STRING", "enum": ["Highest", "High", "Medium", "Low"]},
                                            "quarter": {"type": "STRING"},
                                            "justification": {"type": "STRING"},
                                            "startDate": {"type": "STRING", "format": "date"},
                                            "endDate": {"type": "STRING", "format": "date"},
                                            "status": {"type": "STRING"},
                                            "assignee": {"type": "STRING"},
                                            "progress": {"type": "INTEGER", "minimum": 0, "maximum": 100},
                                            "references": {
                                                "type": "ARRAY",
                                                "items": {
                                                    "type": "OBJECT",
                                                    "properties": {
                                                        "source": {"type": "STRING"},
                                                        "quote": {"type": "STRING"}
                                                    },
                                                    "required": ["source", "quote"]
                                                }
                                            }
                                        },
                                        "required": ["name", "priority", "quarter", "justification", "startDate", "endDate", "status", "assignee", "progress", "references"]
                                    }
                                }
                            },
                            "required": ["name", "goal", "features"]
                        }
                    },

                    "name": {"type": "STRING"}, 
                    "description": {"type": "STRING"}, 
                    "problem_statement": {"type": "STRING"}, 
                    "user_stories": {"type": "ARRAY", "items": {"type": "STRING"}}, 
                    "status": {"type": "STRING"}, 
                    "references": { 
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "source": {"type": "STRING"},
                                "quote": {"type": "STRING"}
                            },
                            "required": ["source", "quote"]
                        }
                    },

                    "bugs": { 
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "description": {"type": "STRING"},
                                "impact": {"type": "STRING"},
                                "frequency": {"type": "STRING"},
                                "references": {
                                    "type": "ARRAY",
                                    "items": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "source": {"type": "STRING"},
                                            "quote": {"type": "STRING"}
                                        },
                                        "required": ["source", "quote"]
                                    }
                                }
                            },
                            "required": ["description", "impact"]
                        }
                    },

                    "summary": {"type": "STRING"}, 

                    "answer": {"type": "STRING"}, 
                    "evidence": { 
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "source": {"type": "STRING"},
                                "quote": {"type": "STRING"}
                            },
                            "required": ["source", "quote"]
                        }
                    },
                    "recommendation": {"type": "STRING"} 
                },
                "required": ["type", "overview_text"] 
            }
        )

        parsed_response = generate_content_with_ai(
            system_instruction,
            generation_config,
            safety_settings=SAFETY_SETTINGS_RELAXED,
            chat_history=chat_history_raw
        )

        if parsed_response:
            
            return jsonify({"roadmap": parsed_response})
        else:
            return jsonify({"error": "AI response was empty or could not be processed. Check backend logs for details."}), 500

    except ValueError as e:
        
        return jsonify({"error": f"AI generation error: {str(e)}"}), 500
    except Exception as e:
        print(f"Error in /generate-roadmap: {e}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

def set_document_store(store):
    global _document_store_ref
    _document_store_ref = store