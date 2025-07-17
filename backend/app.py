
from flask import Flask, jsonify
from flask_cors import CORS
import vertexai


from config import PROJECT_ID, REGION


from services.vertex_ai_service import initialize_vertex_ai_service


from routes.analysis_routes import analysis_bp, set_document_store as set_analysis_document_store
from routes.roadmap_routes import roadmap_bp, set_document_store as set_roadmap_document_store

app = Flask(__name__)
CORS(app)


_document_store = {
    "prd_content": None,
    "feedback_content": None
}


with app.app_context():
    try:
        initialize_vertex_ai_service()
        set_analysis_document_store(_document_store)
        set_roadmap_document_store(_document_store)
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to initialize Vertex AI or set up document store: {e}")
      
        exit(1) 


app.register_blueprint(analysis_bp)
app.register_blueprint(roadmap_bp)

@app.route('/')
def home():
    return jsonify({"message": "Product Strategist Backend is running!"})


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
