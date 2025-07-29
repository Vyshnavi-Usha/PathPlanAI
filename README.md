# PathPlanAI: Turn Chaos into Clarity with AI-Powered Roadmaps

---

## Overview

PathPlanAI is an interactive prototype designed to revolutionize how product leaders synthesize complex information and generate strategic roadmaps. This tool acts as an intelligent strategic partner, efficiently integrating structured Product Requirements Documents (PRDs) with unstructured user feedback. It empowers users to generate dynamic, data-driven roadmaps through natural language prompts, enhancing decision-making efficiency and strategic alignment.

---

## Features

- **Intelligent Data Ingestion:** Processes and synthesizes content from diverse sources, including PDF/text PRDs and plain text/CSV user feedback.
- **Prompt-Driven Interaction:** Engage with the tool via a natural language chat interface to pose strategic questions.
- **Dynamic & Contextual Roadmap Generation:**
  - AI intelligently weighs user feedback against PRD strategic goals.
  - Customizable prioritization based on user-specified effort allocation (e.g., "60% PRD strategy, 30% top user requests, 10% tech debt").
  - Handles complex, multi-intent prompts (e.g., bug fixes, feature briefs with justifications from user quotes).
- **Rich Data Visualization:** Roadmaps are presented through interactive views including a detailed table, Gantt chart, Kanban board, and chronological timeline.
- **Transparency & Explainability:** AI-generated insights include references linking directly to source quotes from the PRD or user feedback.

---

## AI & Technical Highlights

This prototype is built upon Google Vertex AI's `gemini-2.0-flash` model, chosen for its advanced capabilities in complex instruction following, reliable structured JSON output generation, and contextual understanding.

The architecture comprises:

- **Backend (Flask/Python):** Manages document ingestion, maintains an in-memory document store, and orchestrates direct API calls to Vertex AI. It employs concurrent threading for optimized initial analysis.
- **Frontend (React/Ant Design):** Provides a modern, responsive user interface for seamless interaction and dynamic visualization of AI-generated strategic outputs.
- **Prompt Engineering:** Extensive prompt engineering, including detailed system instructions and explicit JSON schemas, was crucial to guide the AI, minimize hallucination, and ensure precise, actionable outputs.

---

## Ethical AI Considerations

Our project integrates foundational ethical AI considerations:

- **Transparency:** AI insights are linked to source references for verifiability.
- **Bias Mitigation:** Designed as an augmentation tool for human decision-making, acknowledging the need for human oversight to mitigate potential biases from input data.
- **Data Privacy:** All uploaded content is processed in a temporary, in-memory backend store and is not persistently saved in this prototype.
- **Managing Hallucination:** Rigorous prompt engineering and strict JSON schemas are employed to enhance the reliability and accuracy of strategic outputs.

---

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- Python 3.8+
- Node.js (LTS recommended) & npm/yarn
- Google Cloud Project with Vertex AI API enabled and authenticated access (e.g., via `gcloud auth application-default login`)

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <your-repository-name>
```

### 2. Backend Setup

- Navigate to the backend directory:

```bash
cd backend
```

#### Create and activate a Python virtual environment:

```bash

python -m venv venv
# On Windows: .\venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate
```

#### Install Python dependencies:

```bash
pip install -r requirements.txt
```

Set up your Google Cloud Project ID and Region. It's recommended to use environment variables.

#### Create a .env file in the backend directory:

```bash
# .env file in backend/
PROJECT_ID="your-gcp-project-id"
REGION="your-gcp-region" # e.g., us-central1
```

#### Run the Flask backend:

```bash
python app.py
```

The backend should start on http://127.0.0.1:5000.

### 3. Frontend Setup

Ensure you are in the project's root directory (where your src folder and package.json file are located).

#### Install Node.js dependencies:

```bash
npm install # or yarn install
```

#### Start the React development server:

```bash
npm run dev
```

The frontend should open in your browser, typically at http://localhost:3000.

## Usage

- **Upload Documents:** On the initial screen, upload your Product Requirements Document (PRD) and User Feedback data. The system supports PDF for PRD, and TXT for feedback.

- **Analyze Documents:** Click "Analyze Documents" to let the AI perform initial summarization and analytics.

- **Interact with the AI:** Once analyzed, use the chat interface to ask strategic questions (e.g.,  
  _"Generate a roadmap for Q3 focusing on enterprise collaboration,"_  
  _"Show me a balanced roadmap with 60% PRD, 30% user requests, 10% tech debt"_).

- **Explore Outputs:** View detailed roadmaps (table, Gantt, Kanban, timeline), feature briefs, or bug lists in the main content area.

- **Download:** Download AI-generated outputs as JSON files for further use.

---

## Future Enhancements

- Expanded data integrations with project management tools and customer feedback platforms.

- Proactive AI insights and suggestions.

- Interactive editing of AI-generated plans.

- User management, collaboration features, and persistent storage.

- Scalable cloud deployment.

- Live feedback collection.

### Demo Video

[Download Demo Video (9.3 MB)](./Demo.mp4)
- **Note:** GitHub can't preview this video file inline. Please download it to watch.

