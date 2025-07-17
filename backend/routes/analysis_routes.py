from flask import Blueprint, request, jsonify
import base64
import time
from threading import Thread
from utils.pdf_extractor import extract_text_from_pdf
from services.vertex_ai_service import generate_content_with_ai, SAFETY_SETTINGS_RELAXED
from vertexai.generative_models import GenerationConfig

analysis_bp = Blueprint('analysis_routes', __name__)
_document_store_ref = {}

FEEDBACK_CATEGORIES = [
    "Features", "Usability", "Bugs", "Performance", "Support", "Praise",
    "Pricing", "Content", "Security", "Improvements", "Accessibility",
    "Stability", "Design", "Reliability"
]

@analysis_bp.route('/initial-analysis', methods=['POST'])
def initial_analysis_endpoint():
    global _document_store_ref
    try:
        start_time = time.time()
        data = request.get_json()
        prd_content_raw = data.get('prdContent')
        feedback_content_raw = data.get('feedbackContent')
        is_prd_pdf = data.get('isPrdPdf', False)

        if not prd_content_raw:
            return jsonify({"error": "PRD content is required for initial analysis"}), 400
        if not feedback_content_raw:
            return jsonify({"error": "User feedback content is required for initial analysis"}), 400

        
        parsed_prd_content = ""
        if is_prd_pdf:
            try:
                pdf_binary_data = base64.b64decode(prd_content_raw)
                parsed_prd_content = extract_text_from_pdf(pdf_binary_data)
                if parsed_prd_content is None:
                    return jsonify({
                        "error": "Failed to extract text from uploaded PDF for PRD analysis. Please try a text-searchable PDF."
                    }), 500
            except Exception as e:
                return jsonify({"error": f"Invalid PDF or parsing error: {e}"}), 400
        else:
            parsed_prd_content = prd_content_raw

        _document_store_ref["prd_content"] = parsed_prd_content
        _document_store_ref["feedback_content"] = feedback_content_raw

        
        prd_analysis_prompt = f"""
        Analyze the following Product Requirements Document (PRD). Extract:
        - Up to 10 bullet points summarizing main goals or features (each under 20 words).
        - Up to 5 key product features (under 20 words).
        - Up to 5 success metrics (under 20 words).
        - Up to 5 technical requirements (under 20 words).
        - A concise summary of the PRD in under 40 words.

        PRD Content:
        {parsed_prd_content}

        Return a JSON:
        {{
            "bulletPoints": ["string", ...],
            "keyFeatures": ["string", ...],
            "successMetrics": ["string", ...],
            "technicalRequirements": ["string", ...],
            "summary": "string"
        }}
        """

        prd_generation_config = GenerationConfig(
            temperature=0.4,
            max_output_tokens=2048,
            response_mime_type="application/json"
        )

        categories_str = ", ".join(FEEDBACK_CATEGORIES)
        feedback_analysis_prompt = f"""
        Analyze the user feedback below:
        - Count total feedback items.
        - Classify sentiment (positive, negative, neutral) and provide up to 3 short summaries (each < 20 words) per sentiment.
        - Categorize feedback into: {categories_str}. Return a count for each.

        User Feedback:
        {feedback_content_raw}

        Return a JSON:
        {{
            "total": int,
            "positive": int,
            "negative": int,
            "neutral": int,
            "summaries": {{
                "positive": ["string", ...],
                "negative": ["string", ...],
                "neutral": ["string", ...]
            }},
            "categoryCounts": {{
                "Features": int, "Usability": int, "Bugs": int, "Performance": int,
                "Support": int, "Praise": int, "Pricing": int, "Content": int,
                "Security": int, "Improvements": int, "Accessibility": int,
                "Stability": int, "Design": int, "Reliability": int
            }}
        }}
        """

        feedback_generation_config = GenerationConfig(
            temperature=0.4,
            max_output_tokens=8192,
            response_mime_type="application/json"
        )

        
        results = {}

        def analyze_prd():
            try:
                results['prd'] = generate_content_with_ai(
                    prd_analysis_prompt, prd_generation_config, safety_settings=SAFETY_SETTINGS_RELAXED
                )
            except Exception as e:
                print(f"PRD AI call error: {e}")
                results['prd'] = None

        def analyze_feedback():
            try:
                results['feedback'] = generate_content_with_ai(
                    feedback_analysis_prompt, feedback_generation_config, safety_settings=SAFETY_SETTINGS_RELAXED
                )
            except Exception as e:
                print(f"Feedback AI call error: {e}")
                results['feedback'] = None

        t1 = Thread(target=analyze_prd)
        t2 = Thread(target=analyze_feedback)

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        prd_analysis_result = results.get('prd') or {
            "bulletPoints": [], "keyFeatures": [], "successMetrics": [],
            "technicalRequirements": [], "summary": "PRD analysis unavailable."
        }

        feedback_analysis_result = results.get('feedback') or {
            "total": 0, "positive": 0, "negative": 0, "neutral": 0,
            "summaries": {"positive": [], "negative": [], "neutral": []},
            "categoryCounts": {cat: 0 for cat in FEEDBACK_CATEGORIES}
        }

       
        prd_md = "# Product Requirements Document (PRD) Summary\n\n"
        prd_md += f"**Overall Summary:** {prd_analysis_result.get('summary', 'N/A')}\n\n"

        def list_to_md(title, items):
            md = f"**{title}:**\n"
            if items:
                md += "".join([f"- {item}\n" for item in items])
            else:
                md += "- None available.\n"
            return md + "\n"

        prd_md += list_to_md("Key Bullet Points", prd_analysis_result.get("bulletPoints", []))
        prd_md += list_to_md("Key Features", prd_analysis_result.get("keyFeatures", []))
        prd_md += list_to_md("Success Metrics", prd_analysis_result.get("successMetrics", []))
        prd_md += list_to_md("Technical Requirements", prd_analysis_result.get("technicalRequirements", []))

        feedback_md = "# User Feedback Analytics\n\n"
        feedback_md += f"**Total Feedback Items:** {feedback_analysis_result.get('total', 0)}\n"
        feedback_md += f"**Positive:** {feedback_analysis_result.get('positive', 0)}\n"
        feedback_md += f"**Negative:** {feedback_analysis_result.get('negative', 0)}\n"
        feedback_md += f"**Neutral:** {feedback_analysis_result.get('neutral', 0)}\n\n"

        feedback_md += "**Key Insights:**\n"
        for sentiment in ['positive', 'negative', 'neutral']:
            for item in feedback_analysis_result['summaries'].get(sentiment, []):
                feedback_md += f"- {item}\n"
        feedback_md += "\n"

        feedback_md += "**Category Counts:**\n"
        for cat in FEEDBACK_CATEGORIES:
            count = feedback_analysis_result['categoryCounts'].get(cat, 0)
            feedback_md += f"- {cat}: {count}\n"
        feedback_md += "\n"

        total_time = time.time() - start_time
        print(f"/initial-analysis total time: {total_time:.2f} seconds")

        return jsonify({
            "prdAnalysis": prd_analysis_result,
            "feedbackAnalysis": feedback_analysis_result,
            "prdDownloadableSummary": prd_md,
            "feedbackDownloadableSummary": feedback_md
        })

    except ValueError as e:
        return jsonify({"error": f"AI analysis error: {str(e)}"}), 500
    except Exception as e:
        print(f"Error in /initial-analysis: {e}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


def set_document_store(store):
    global _document_store_ref
    _document_store_ref = store
