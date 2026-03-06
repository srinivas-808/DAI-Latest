# 🏥 Diagnos AI

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![React](https://img.shields.io/badge/react-18.0-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.68.1-009688.svg)

**Diagnos AI** is a next-generation healthcare assistant powered by Google Gemini. It provides a secure, multimodal interface for medical inquiries, symptom diagnosis, and image-based analysis.

## ✨ Core Features

*   **💬 Medical RAG Chat**: Specialized chatbot for answering health-related queries with context awareness.
*   **👁️ Vision Analysis**: Upload X-rays, MRIs, or other medical images for AI-powered insights (powered by Gemini Vision).
*   **🩺 Intelligent Diagnosis**: Input symptoms to receive a potential assessment and care suggestions.
*   **🔑 Secure API Key Management**: Built-in UI for safe and persistent API key configuration.

---

## 🛠️ System Requirements

*   **OS**: Linux or Windows (via WSL2)
    *   *Note: This application mimics a production Linux environment and is best run on Ubuntu/Debian based systems.*
*   **Python**: 3.12 or newer
*   **Node.js**: v18 (LTS) or newer

---

## 🚀 Installation & Setup

Follow these steps to set up the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/diagnos-ai.git
cd diagnos-ai
```

### 2. Backend Setup

Set up the Python environment and install dependencies.

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

Install the React frontend dependencies and build the static assets.

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build
```
---

## ▶️ Running the Application

We provide a convenient script to launch both the backend server and the frontend interface with a single command.

```bash
# Return to the project root
cd ..

# Make the script executable
chmod +x run.sh

# Start the application
./run.sh
```

**What happens next?**
*   The Backend API starts on `http://127.0.0.1:8000`
*   The Frontend Portal opens at `http://127.0.0.1:8000` (served statically)
*   **Note**: If it's your first time, you'll see the landing page and the API Key verification.

---

## 🛡️ Security & Privacy

*   **Local Execution**: All logic runs locally on your machine, communicating directly with the Gemini API.
*   **Key Safety**: Your API key is stored in `.env`, which is ignored by Git to prevent accidental leaks.
*   **Disclaimer**: This tool is for educational purposes only and is **not a substitute for professional medical advice**.

---

## 🤝 Contributing

Contributions are welcome! Please ensure you:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.