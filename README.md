# 🏥 Diagnos AI

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![React](https://img.shields.io/badge/react-18.0-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.68.1-009688.svg)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)

**Diagnos AI** is a next-generation healthcare intelligence platform powered by Google Gemini. It provides a secure, multimodal interface for medical inquiries, symptom diagnosis, and advanced image-based analysis.

---

## ✨ Core Features

*   **💬 Dual Chat Modes**:
    *   **Medical Query**: Get quick, accurate answers to health-related questions.
    *   **Clinical Consultation (Doctor Mode)**: An empathetic, step-by-step diagnostic experience that mimics a real doctor's consultation.
*   **👁️ Vision Analysis**: Upload X-rays, MRIs, or other medical images for AI-powered insights (powered by Gemini 2.0 Flash).
*   **🩺 Intelligent Diagnosis**: Specialized tools for symptom extraction and rule-based preliminary analysis.
*   **🌐 Multilingual Support**: Seamlessly translate AI responses into **Hindi** and **Telugu**.
*   **🎙️ Voice Intelligence**: Natural-sounding Text-to-Speech in English, Hindi, and Telugu (powered by Sarvam AI).
*   **🔑 Secure Architecture**: Local environment management for GEMINI and SARVAM API keys.

---

## 🛠️ System Requirements

*   **OS**: Windows or Linux
*   **Python**: 3.12 or newer
*   **Node.js**: v18 (LTS) or newer
*   **API Keys**: 
    *   [Google Gemini API Key](https://aistudio.google.com/app/apikey)
    *   [Sarvam AI API Key](https://www.sarvam.ai/) (optional, for multilingual TTS)

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/diagnos-ai.git
cd diagnos-ai
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GEMINI_API_KEY=your_gemini_key_here
SARVAM_API_KEY=your_sarvam_key_here
```

### 3. Automatic Launcher (Recommended)

The easiest way to start Diagnos AI is using the unified launcher script:

```bash
# On Windows/Linux
python launcher.py
```
This script will:
1. Create and manage virtual environments.
2. Install backend and frontend dependencies.
3. Build the frontend assets.
4. Start both the FastAPI backend and the static file server.

---

## 📂 Project Structure

- **`backend/`**: FastAPI application handling AI orchestration, safety guards, and tool integration.
    - `app/agent/`: Core LLM logic and system prompts (Doctor mode vs. Query mode).
    - `app/api/`: REST endpoints for chat, streaming, TTS, and translation.
- **`frontend/`**: Modern React SPA with Liquid Glass UI design and real-time streaming updates.

---

## 🛡️ Security & Privacy

*   **Local Execution**: API keys are stored locally and never shared.
*   **Safety Guards**: Built-in emergency detection system to redirect users to urgent care when necessary.
*   **Disclaimer**: This tool is for **educational and informational purposes only**. It does not provide medical diagnoses or replace professional medical judgment.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.