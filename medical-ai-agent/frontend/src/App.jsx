import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot, User, BrainCircuit, Stethoscope, FileUp, ImagePlus,
  Loader2, Sparkles, XCircle, Trash2,
  MessageSquarePlus, Send, ArrowRight, ShieldCheck, Activity, Zap, Volume2,
  AlertTriangle, CheckCircle, Info, Wifi, WifiOff, RefreshCw, Heart, Languages, Globe, ChevronDown,
  Maximize2, Minimize2
} from 'lucide-react';
import './App.css';

/* ================= BACKEND CONFIG ================= */
const API_BASE = ""; // Relative path to use Vite proxy (essential for ngrok)
const API_CHAT = `${API_BASE}/api/chat`;
const API_STREAM = `${API_BASE}/api/chat-stream`;
const API_TTS = `${API_BASE}/api/tts`;
const API_TRANSLATE = `${API_BASE}/api/translate`;
const API_HEALTH = `${API_BASE}/api/health`;
const API_CHECK_KEY = `${API_BASE}/api/check-key`;
const API_SET_KEY = `${API_BASE}/api/set-key`;

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

// Helper for generating IDs
const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15);
  }
};

// Fetch with timeout helper
const fetchWithTimeout = (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
};


/* ================= TOAST SYSTEM ================= */

const ToastContext = React.createContext();

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-3 pointer-events-none" id="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-sm max-w-sm
              ${toast.exiting ? 'toast-exit' : 'toast-enter'}
              ${toast.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-800' :
                toast.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' :
                  toast.type === 'warning' ? 'bg-amber-50/95 border-amber-200 text-amber-800' :
                    'bg-blue-50/95 border-blue-200 text-blue-800'
              }`}
          >
            {toast.type === 'error' && <AlertTriangle size={18} className="shrink-0" />}
            {toast.type === 'success' && <CheckCircle size={18} className="shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle size={18} className="shrink-0" />}
            {toast.type === 'info' && <Info size={18} className="shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => React.useContext(ToastContext);


/* ================= TYPING INDICATOR ================= */

const TypingIndicator = () => (
  <div className="flex items-start gap-3 animate-fade-in-up">
    <div className="shrink-0 w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white">
      <Bot size={20} />
    </div>
    <div className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-[1.5rem] rounded-bl-none">
      <div className="flex items-center gap-1 h-5">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  </div>
);


/* ================= CONNECTION STATUS ================= */

const ConnectionStatus = ({ isConnected, onRetry }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
    ${isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200 cursor-pointer hover:bg-red-100'}`}
    onClick={!isConnected ? onRetry : undefined}
    title={isConnected ? "Connected to backend" : "Click to retry connection"}
    id="connection-status"
  >
    <div className={`w-2 h-2 rounded-full ${isConnected ? 'status-connected' : 'status-disconnected'}`} />
    {isConnected ? 'Connected' : (
      <>
        <span>Disconnected</span>
        <RefreshCw size={12} />
      </>
    )}
  </div>
);


/* ================= CONFIDENCE BAR ================= */

const ConfidenceBar = ({ label, confidence }) => {
  const pct = Math.round(confidence * 100);
  const color = pct >= 70 ? 'bg-red-500' : pct >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  const bgColor = pct >= 70 ? 'bg-red-100' : pct >= 40 ? 'bg-amber-100' : 'bg-emerald-100';
  const textColor = pct >= 70 ? 'text-red-700' : pct >= 40 ? 'text-amber-700' : 'text-emerald-700';

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm font-medium text-slate-700 w-48 truncate" title={label}>{label}</span>
      <div className={`flex-grow h-2.5 ${bgColor} rounded-full overflow-hidden`}>
        <div className={`h-full ${color} rounded-full confidence-bar`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold ${textColor} w-12 text-right`}>{pct}%</span>
    </div>
  );
};


import LandingPage from './LandingPage';

/* ================= API KEY MODAL ================= */

const ApiKeyModal = ({ onSave }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!key.trim()) {
      setError('Please enter an API key.');
      return;
    }

    if (key.trim().length < 10) {
      setError('API key appears to be too short.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithTimeout(API_SET_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onSave();
      } else {
        setError(data.message || 'Failed to save key. Please try again.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError('Cannot connect to backend. Is the server running?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4" id="api-key-modal">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Enter Gemini API Key</h2>
          <p className="text-slate-500 text-sm mt-2">
            A valid Gemini API Key is required to power the medical intelligence of Diagnos AI.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="api-key-input"
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(''); }}
              placeholder="Paste your API Key here..."
              className="w-full px-5 py-4 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 bg-slate-50 text-sm font-mono transition-all"
              autoFocus
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 py-2.5 px-4 rounded-lg border border-red-100 animate-fade-in-up">
              <AlertTriangle size={16} className="shrink-0" />
              {error}
            </div>
          )}
          <button
            id="activate-btn"
            type="submit"
            disabled={!key || loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Activate System'}
          </button>
        </form>
        <p className="text-xs text-center text-slate-400 mt-6">
          Your key is stored locally in <code className="bg-slate-100 px-1 py-0.5 rounded">.env</code> and never leaves your machine.
        </p>
      </div>
    </div>
  );
};

/* ================= MAIN PORTAL APP ================= */

const App = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

const AppContent = () => {
  const sessionIdRef = useRef(generateId());
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! Welcome to **Diagnos AI**. I\'m your medical information assistant, ready to help with health-related questions, symptom analysis, and medical image interpretation.\n\nHow can I help you today?' }
  ]);
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [agentMode, setAgentMode] = useState('medical_query');
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);

  // Persistent State for Prediction Tab
  const [predFile, setPredFile] = useState(null);
  const [predPreview, setPredPreview] = useState("");
  const [predResult, setPredResult] = useState("");

  // Persistent State for Diagnosis Tab
  const [diagSymptoms, setDiagSymptoms] = useState('');
  const [diagResult, setDiagResult] = useState('');

  const toast = useToast();

  // Connection health check
  const checkConnection = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(API_HEALTH, {}, 5000);
      setIsConnected(res.ok);
      return res.ok;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, []);

  // Periodic connection check
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Keyboard shortcuts for Maximize/Minimize
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMaximized(false);
        return;
      }

      // Ignore 'f' toggle if the user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsMaximized(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLaunch = async () => {
    try {
      setIsCheckingKey(true);
      const connected = await checkConnection();
      if (!connected) {
        toast('Cannot connect to backend. Please ensure the server is running.', 'error');
        setIsCheckingKey(false);
        return;
      }

      const res = await fetchWithTimeout(API_CHECK_KEY);
      if (!res.ok) throw new Error("Backend unreachable");
      const data = await res.json();

      if (data.has_key) {
        setShowLanding(false);
        toast('Portal activated successfully!', 'success', 2000);
      } else {
        setNeedsApiKey(true);
      }
    } catch (e) {
      console.error("Backend check failed", e);
      if (e.name === 'AbortError') {
        toast('Connection timed out. Please check your backend server.', 'error');
      } else {
        setNeedsApiKey(true);
      }
    } finally {
      setIsCheckingKey(false);
    }
  };

  const onApiKeySaved = () => {
    setNeedsApiKey(false);
    setShowLanding(false);
    toast('API Key saved & system activated!', 'success');
  };

  const tabs = [
    { id: 'chat', label: 'Chat Agent', icon: <Bot className="w-5 h-5 mr-2" /> },
    { id: 'prediction', label: 'Prediction', icon: <BrainCircuit className="w-5 h-5 mr-2" /> },
    { id: 'diagnosis', label: 'Diagnosis', icon: <Stethoscope className="w-5 h-5 mr-2" /> },
  ];

  const processChatMessage = async (userInput, file = null) => {
    if (!userInput.trim() && !file) return;

    if (!isConnected) {
      toast('Not connected to backend. Please check your server.', 'error');
      return;
    }

    // Optimistic UI update
    setMessages(prev => [...prev, {
      role: "user",
      text: userInput,
      image: file ? URL.createObjectURL(file) : null
    }]);

    setIsBotLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", userInput || "Analyze this medical image");
      formData.append("session_id", sessionIdRef.current);
      if (file) {
        formData.append("file", file);
      }
      formData.append("agent_mode", agentMode);

      const res = await fetchWithTimeout(API_STREAM, { method: "POST", body: formData }, 60000);
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Server error (${res.status}): ${errorText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botText = "";
      setMessages(prev => [...prev, { role: "bot", text: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        if (chunk.includes("[END]")) {
          // Parse any remaining data before [END]
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const content = line.replace("data: ", "").trim();
              if (content === "[END]") break;
              if (content) botText += content + " ";
            }
          }
          break;
        }

        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const content = line.replace("data: ", "").trim();
            if (content === "[END]") break;
            if (content) botText += content + " ";
          }
        }

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: botText };
          return updated;
        });
      }

      // Final update with trimmed text
      if (botText.trim()) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: botText.trim() };
          return updated;
        });
      }

    } catch (error) {
      console.error("Chat error:", error);
      let errorMsg = 'Something went wrong. Please try again.';
      if (error.name === 'AbortError') {
        errorMsg = 'The request timed out. The server may be busy — please try again.';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMsg = 'Cannot reach the server. Please check your connection.';
        setIsConnected(false);
      }
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ **Connection Error**\n\n${errorMsg}`, isError: true }]);
      toast(errorMsg, 'error');
    } finally {
      setIsBotLoading(false);
    }
  };

  const handleImportToChat = (content, type) => {
    const contextMap = {
      prediction: "I just received this medical image analysis:\n\n",
      diagnosis: "I just received this symptom-based assessment:\n\n"
    };
    const fullMessage = `${contextMap[type]}"${content}"\n\nCan you explain this result to me in detail?`;
    setActiveTab('chat');
    processChatMessage(fullMessage);
  };

  // Render Landing or Portal
  if (showLanding) {
    return (
      <>
        {isCheckingKey && (
          <div className="fixed inset-0 z-[60] bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="text-sm font-medium text-slate-500">Connecting to backend...</span>
            </div>
          </div>
        )}
        {needsApiKey && <ApiKeyModal onSave={onApiKeySaved} />}
        <LandingPage onStart={handleLaunch} />
      </>
    );
  }

  return (
    <div className="bg-slate-100 h-screen font-sans text-slate-800 flex flex-col antialiased relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-teal-400/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {needsApiKey && <ApiKeyModal onSave={() => { setNeedsApiKey(false); toast('API Key updated!', 'success'); }} />}
      
      {!isMaximized && (
        <header className="bg-white/80 backdrop-blur-md shadow-sm z-30 border-b border-slate-200/50 shrink-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center cursor-pointer group" onClick={() => setShowLanding(true)} id="logo-link">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg">
                <Stethoscope size={24} />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Diagnos AI</h1>
            </div>
            <div className="flex items-center gap-3">
              <ConnectionStatus isConnected={isConnected} onRetry={checkConnection} />
                <button id="exit-portal-btn" onClick={() => setShowLanding(true)} className="text-slate-500 hover:text-rose-600 text-sm font-medium transition-colors">Exit Portal</button>
            </div>
          </div>
          <nav id="main-nav">
            <ul className="flex border-b border-slate-200">
              {tabs.map(tab => (
                <li key={tab.id}>
                  <button
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center px-8 py-4 text-sm font-bold transition-all duration-300 -mb-px border-b-2 relative ${activeTab === tab.id
                      ? 'text-blue-600 border-blue-600'
                      : 'border-transparent text-slate-400 hover:text-blue-500'}`}
                  >
                    {tab.icon} {tab.label}
                    {activeTab === tab.id && <div className="absolute inset-0 bg-blue-50/50 rounded-t-xl -z-10 animate-fade-in-up" />}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      )}

      <main className={`flex-grow flex flex-col overflow-hidden mx-auto z-10 w-full transition-all duration-500 ${isMaximized ? 'p-2 sm:p-4 pb-2 sm:pb-4 max-w-[100vw]' : 'container p-2 sm:p-4 lg:p-6'}`}>
        <div className={`glass-panel flex-grow flex flex-col liquid-gradient transition-all duration-500 relative w-full h-full z-20 ${isMaximized ? 'rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-5 border border-white/50' : 'p-4 md:p-6 rounded-[2.5rem]'}`}>
          
          {/* Maximize Toggle Button */}
          <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 bg-white/50 hover:bg-white text-slate-500 hover:text-blue-600 rounded-xl shadow-sm backdrop-blur-md border border-white/50 transition-all hover:scale-105"
              title={isMaximized ? "Restore view" : "Maximize view"}
            >
              {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>

          {activeTab === 'chat' && <ChatAgent messages={messages} onSendMessage={processChatMessage} isLoading={isBotLoading} agentMode={agentMode} setAgentMode={setAgentMode} />}
          {activeTab === 'prediction' && (
            <PredictionComponent
              sessionId={sessionIdRef.current}
              onImportToChat={(res) => handleImportToChat(res, 'prediction')}
              isConnected={isConnected}
              file={predFile} setFile={setPredFile}
              preview={predPreview} setPreview={setPredPreview}
              result={predResult} setResult={setPredResult}
            />
          )}
          {activeTab === 'diagnosis' && (
            <DiagnosisComponent
              sessionId={sessionIdRef.current}
              onImportToChat={(res) => handleImportToChat(res, 'diagnosis')}
              isConnected={isConnected}
              symptoms={diagSymptoms} setSymptoms={setDiagSymptoms}
              diagnosis={diagResult} setDiagnosis={setDiagResult}
            />
          )}
        </div>
      </main>
      
      {!isMaximized && (
        <footer className="text-center py-2 pb-4 text-xs text-slate-400 flex items-center justify-center gap-2 shrink-0">
          <Heart size={12} className="text-red-400" />
          DiagnosAI - AI Powered Healthcare
        </footer>
      )}
    </div>
  );
};

/* ================= PREDICTION MODULE ================= */

const PredictionComponent = ({
  sessionId, onImportToChat, isConnected,
  file, setFile, preview, setPreview, result, setResult
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const processFile = (f) => {
    if (!f) return;

    // Client-side validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'];
    if (!allowedTypes.includes(f.type)) {
      toast(`Unsupported file type: ${f.type}. Please upload an image.`, 'error');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast('File is too large. Maximum size is 10MB.', 'error');
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult("");
  };

  const handlePredict = async () => {
    if (!file) return;
    if (!isConnected) {
      toast('Not connected to backend.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("message", "Please analyze this medical image and provide a detailed assessment.");
      fd.append("session_id", sessionId);
      const res = await fetchWithTimeout(API_CHAT, { method: "POST", body: fd }, 60000);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setResult(data.response || "No response received from the AI.");
      toast('Image analysis complete!', 'success', 2000);
    } catch (error) {
      console.error("Prediction error:", error);
      if (error.name === 'AbortError') {
        setResult("⚠️ The analysis timed out. The image may require more processing time. Please try again.");
      } else {
        setResult(`⚠️ ${error.message}`);
      }
      toast(error.message || 'Analysis failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start min-h-[500px]" id="prediction-panel">
      <div className="w-full md:w-1/2 md:sticky md:top-40">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
          className={`flex flex-col items-center justify-center p-8 border-4 border-dashed rounded-[2.5rem] h-[450px] transition-all relative group
                        ${isDragging ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-slate-50 hover:border-blue-300'}
                    `}
          id="image-dropzone"
        >
          {preview ? (
            <img src={preview} alt="Medical scan preview" className="max-h-full rounded-2xl shadow-lg object-contain" />
          ) : (
            <div className="text-center space-y-3">
              <FileUp size={48} className="opacity-20 mx-auto" />
              <p className="text-slate-400 text-sm font-medium">Drag & drop a medical image here</p>
              <p className="text-slate-300 text-xs">Supports PNG, JPG, GIF, BMP, WEBP (max 10MB)</p>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files[0])} className="hidden" accept="image/*" id="prediction-file-input" />
          <button id="browse-files-btn" onClick={() => fileInputRef.current.click()} className="mt-6 bg-white text-blue-600 font-bold px-8 py-2.5 rounded-full border border-blue-100 shadow-sm hover:bg-blue-600 hover:text-white transition-all">
            {preview ? 'Change Image' : 'Browse Files'}
          </button>
        </div>
      </div>
      <div className="w-full md:w-1/2 flex flex-col space-y-6">
        <button id="run-prediction-btn" onClick={handlePredict} disabled={!file || isLoading} className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center text-lg hover:bg-blue-700 disabled:bg-slate-300 transition-all">
          {isLoading ? <Loader2 className="animate-spin mr-3" /> : <BrainCircuit className="mr-3" />}
          {isLoading ? 'Analyzing...' : 'Run Vision Prediction'}
        </button>
        <div className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
          {result ? (
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 animate-fade-in-up">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-50/90 py-1 z-10 border-b border-slate-200/50">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Analysis Results</h3>
                <button id="discuss-prediction-btn" onClick={() => onImportToChat(result)} className="text-blue-600 hover:bg-blue-600 hover:text-white flex items-center text-xs font-bold gap-2 px-4 py-2 rounded-full transition-all border border-blue-200 bg-white">
                  <MessageSquarePlus size={14} /> Discuss in Chat
                </button>
              </div>
              <div className="text-sm text-slate-700 leading-relaxed markdown-body">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-300 space-y-3 border border-dashed rounded-[2rem]">
              <BrainCircuit size={40} className="mx-auto opacity-30" />
              <p className="text-sm font-medium">Upload an image and click "Run Vision Prediction"</p>
              <p className="text-xs text-slate-300">Supports X-Rays, MRIs, ECGs, and other medical images</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= DIAGNOSIS MODULE ================= */

const DiagnosisComponent = ({
  sessionId, onImportToChat, isConnected,
  symptoms, setSymptoms, diagnosis, setDiagnosis
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const symptomPool = ["Persistent dry cough", "High fever", "Back pain", "Migraine",
    "Shortness of breath", "Sudden rash", "Dizziness", "Fatigue",
    "Sore throat", "Joint stiffness", "Nausea", "Blurred vision",
    "Loss of appetite", "Chest tightness", "Muscle aches", "Insomnia"];

  const isSymptomActive = (s) => symptoms.toLowerCase().includes(s.toLowerCase());
  const sorted = [...symptomPool].sort((a, b) => (isSymptomActive(a) ? -1 : 1));

  const toggle = (s) => {
    setSymptoms(prev => {
      const list = prev.split(',').map(x => x.trim()).filter(x => x);
      if (list.some(i => i.toLowerCase() === s.toLowerCase())) {
        return list.filter(i => i.toLowerCase() !== s.toLowerCase()).join(', ');
      }
      return prev ? `${prev}, ${s}` : s;
    });
  };

  const handleDiagnose = async () => {
    if (!symptoms.trim()) {
      toast('Please add at least one symptom.', 'warning');
      return;
    }
    if (!isConnected) {
      toast('Not connected to backend.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("message", `I am experiencing the following symptoms and would like a detailed assessment: ${symptoms}`);
      fd.append("session_id", sessionId);
      const res = await fetchWithTimeout(API_CHAT, { method: "POST", body: fd }, 60000);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setDiagnosis(data.response || "No response received from the AI.");
      toast('Assessment generated!', 'success', 2000);
    } catch (error) {
      console.error("Diagnosis error:", error);
      if (error.name === 'AbortError') {
        setDiagnosis("⚠️ The assessment timed out. Please try again.");
      } else {
        setDiagnosis(`⚠️ ${error.message}`);
      }
      toast(error.message || 'Assessment failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-left" id="diagnosis-panel">
      <div className="flex justify-between items-end px-2">
        <h3 className="text-lg font-bold flex items-center"><Sparkles size={20} className="mr-2 text-blue-500" /> Symptoms</h3>
        {symptoms && <button id="clear-symptoms-btn" onClick={() => { setSymptoms(''); setDiagnosis(''); }} className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"><Trash2 size={14} /> Clear All</button>}
      </div>
      <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar scroll-smooth" id="symptom-chips">
        {sorted.map(s => (
          <button key={s} onClick={() => toggle(s)} className={`shrink-0 px-5 py-2.5 text-xs font-bold rounded-full border transition-all ${isSymptomActive(s) ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 hover:border-blue-400'}`}>
            {s}
          </button>
        ))}
      </div>
      <textarea id="symptoms-textarea" value={symptoms} onChange={e => setSymptoms(e.target.value)} rows="6" placeholder="Describe your symptoms in detail, or select from the tags above..." className="w-full p-6 border-2 border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 bg-slate-50 text-sm shadow-inner transition-all" />
      <button id="generate-assessment-btn" onClick={handleDiagnose} disabled={isLoading || !symptoms.trim()} className="w-full bg-slate-800 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center text-lg disabled:bg-slate-300">
        {isLoading ? <Loader2 className="animate-spin mr-3" /> : <Stethoscope className="mr-3" />}
        {isLoading ? 'Synthesizing Assessment...' : 'Generate AI Assessment'}
      </button>
      {diagnosis && (
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl animate-fade-in-up" id="diagnosis-result">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Activity size={20} className="text-blue-500" />
              AI Assessment
            </h3>
            <button id="discuss-diagnosis-btn" onClick={() => onImportToChat(diagnosis)} className="text-blue-600 font-bold text-xs flex items-center gap-2 px-4 py-2 rounded-full border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
              <MessageSquarePlus size={16} /> Discuss in Chat
            </button>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed markdown-body">
            <ReactMarkdown>{diagnosis}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= CHAT AGENT ================= */

const ChatAgent = ({ messages, onSendMessage, isLoading, agentMode, setAgentMode }) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [synthesizingIndex, setSynthesizingIndex] = useState(null);
  const [translations, setTranslations] = useState({}); // { index: { lang: 'hi', text: '...' } }
  const [isTranslating, setIsTranslating] = useState(null); // index
  const [showLangMenu, setShowLangMenu] = useState(null); // index
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleTranslate = async (text, i, targetLang) => {
    if (targetLang === 'en') {
      setTranslations(prev => {
        const next = { ...prev };
        delete next[i];
        return next;
      });
      setShowLangMenu(null);
      return;
    }

    setIsTranslating(i);
    try {
      const res = await fetchWithTimeout(API_TRANSLATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_lang: targetLang })
      });
      if (!res.ok) throw new Error('Translation failed');
      const data = await res.json();
      setTranslations(prev => ({
        ...prev,
        [i]: { lang: targetLang, text: data.translated_text }
      }));
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setIsTranslating(null);
      setShowLangMenu(null);
    }
  };

  // Auto-scroll logic: only auto scroll if user is already near bottom
  useEffect(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      if (isNearBottom) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [messages[messages.length - 1]?.text, isLoading]);

  const handleReadMessage = async (text, i) => {
    if (playingIndex === i && audioRef.current) {
      audioRef.current.pause();
      setPlayingIndex(null);
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
        setPlayingIndex(null);
      }
      setSynthesizingIndex(i);

      // Use translated text if available
      const textToRead = translations[i] ? translations[i].text : text;
      const lang = translations[i] ? translations[i].lang : 'en';

      // Strip markdown for TTS
      const cleanText = textToRead.replace(/[*#_`>~\[\]()]/g, '').replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();

      const res = await fetchWithTimeout(API_TTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          language: lang
        })
      }, 300000); // 5 minute timeout for TTS

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Speech synthesis failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setPlayingIndex(null);
      };

      audio.onerror = () => {
        setPlayingIndex(null);
        toast('Audio playback failed.', 'error');
      };

      audioRef.current = audio;
      setPlayingIndex(i);
      audio.play();
    } catch (e) {
      console.error("TTS error:", e);
      setPlayingIndex(null);
      if (e.name === 'AbortError') {
        toast('Speech synthesis timed out.', 'error');
      } else {
        toast(e.message || 'Speech synthesis failed.', 'error');
      }
    } finally {
      setSynthesizingIndex(null);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Client-side validation
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast(`Unsupported file type. Please upload an image.`, 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast('File too large. Maximum size is 10MB.', 'error');
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setTimeout(() => containerRef.current && (containerRef.current.scrollTop = containerRef.current.scrollHeight), 100);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = (e) => {
    e.preventDefault();
    if ((input.trim() || selectedFile) && !isLoading) {
      onSendMessage(input, selectedFile);
      setInput('');
      clearFile();
    }
  };

  return (
    <div className="flex flex-col w-full h-full text-left relative z-10" id="chat-panel">
      {/* Mode Toggle */}
      <div className="flex justify-center shrink-0 mb-4 pt-2">
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200 p-1 rounded-full flex gap-1 shadow-sm">
          <button
            onClick={() => setAgentMode('medical_query')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${agentMode === 'medical_query' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 hover:bg-white/50'}`}
          >
            Medical Query
          </button>
          <button
            onClick={() => setAgentMode('doctor')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${agentMode === 'doctor' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 hover:bg-white/50'}`}
          >
            Clinical Consultation
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-grow overflow-y-auto pr-4 pt-2 space-y-6 custom-scrollbar pb-10"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-in-up`}>
            {msg.role === 'bot' && <div className="shrink-0 w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200"><Bot size={22} /></div>}
            <div className={`max-w-[85%] lg:max-w-3xl px-6 py-5 rounded-[1.8rem] shadow-xl transition-all duration-300 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none hover-liquid-glass-user' : `${msg.isError ? 'bg-red-50/80 border-red-200' : 'bg-white/70 backdrop-blur-sm border-white/50'} text-slate-800 rounded-bl-none border hover-liquid-glass`}`}>

              {/* Display User Image if sent */}
              {msg.image && (
                <div className="mb-3 rounded-xl overflow-hidden shadow-sm border border-white/20">
                  <img src={msg.image} alt="User uploaded medical image" className="max-w-full h-auto max-h-60 object-cover" />
                </div>
              )}

              <div className="flex gap-4 items-start w-full group/msg min-h-[1.5rem]">
                <div className="flex-grow text-sm">
                  {msg.role === 'bot' ? (
                    <div className="markdown-body">
                      <ReactMarkdown>{translations[i] ? translations[i].text : msg.text}</ReactMarkdown>
                      {translations[i] && (
                        <div className="mt-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1">
                          <Languages size={10} /> Translated to {translations[i].lang === 'hi' ? 'Hindi' : 'Telugu'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
                {msg.role === 'bot' && msg.text && (
                  <div className={`shrink-0 flex items-center gap-1`}>
                    {/* Translation Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowLangMenu(showLangMenu === i ? null : i)}
                        className={`transition-all p-1.5 rounded-full ${translations[i] ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-100/50 hover:text-blue-600 hover:bg-slate-200'} ${isLoading && i === messages.length - 1 ? 'hidden' : ''}`}
                        title="Translate response"
                      >
                        {isTranslating === i ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Languages size={16} />
                        )}
                      </button>

                      {showLangMenu === i && (
                        <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-2 min-w-[120px] animate-fade-in-up">
                          <button
                            onClick={() => handleTranslate(msg.text, i, 'en')}
                            className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 flex items-center justify-between ${!translations[i] ? 'text-blue-600' : 'text-slate-600'}`}
                          >
                            English {!translations[i] && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                          </button>
                          <button
                            onClick={() => handleTranslate(msg.text, i, 'hi')}
                            className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 flex items-center justify-between ${translations[i]?.lang === 'hi' ? 'text-blue-600' : 'text-slate-600'}`}
                          >
                            Hindi {translations[i]?.lang === 'hi' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                          </button>
                          <button
                            onClick={() => handleTranslate(msg.text, i, 'te')}
                            className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 flex items-center justify-between ${translations[i]?.lang === 'te' ? 'text-blue-600' : 'text-slate-600'}`}
                          >
                            Telugu {translations[i]?.lang === 'te' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleReadMessage(msg.text, i)}
                      className={`transition-all p-1.5 rounded-full ${playingIndex === i ? 'text-blue-600 bg-blue-100 opacity-100 pulse-glow' : 'text-slate-400 bg-slate-100/50 hover:text-blue-600 hover:bg-slate-200'} ${isLoading && i === messages.length - 1 ? 'hidden' : ''}`}
                      title={playingIndex === i ? "Stop reading" : "Read message aloud"}
                      disabled={synthesizingIndex !== null && synthesizingIndex !== i}
                      aria-label={playingIndex === i ? "Stop reading message" : "Read message aloud"}
                    >
                      {synthesizingIndex === i ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Volume2 size={18} className={playingIndex === i ? "animate-pulse" : ""} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {msg.role === 'user' && <div className="shrink-0 w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white"><User size={20} /></div>}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && messages[messages.length - 1]?.text === "" && <TypingIndicator />}

        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="mt-6 pt-6 relative" id="chat-form">
        {preview && (
          <div className="absolute -top-32 left-0 glass-panel p-3 border border-white/50 shadow-2xl animate-slide-in">
            <div className="relative group">
              <img src={preview} alt="Preview" className="h-28 rounded-2xl object-cover shadow-lg" />
              <button
                type="button"
                onClick={clearFile}
                className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-2 shadow-xl hover:scale-110 transition-transform"
                aria-label="Remove attached image"
              >
                <XCircle size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="relative max-w-5xl mx-auto flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
            id="chat-file-input"
          />
          <button
            type="button"
            id="attach-image-btn"
            onClick={() => fileInputRef.current.click()}
            className="bg-white/70 backdrop-blur-sm text-blue-600 border border-white/50 rounded-2xl w-14 h-14 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-lg hover:shadow-blue-200"
            title="Attach Medical Image"
          >
            <ImagePlus size={24} />
          </button>

          <div className="relative flex-grow">
            <input
              type="text"
              id="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={preview ? "Ask about this image..." : "Describe symptoms or ask health questions..."}
              className="w-full pl-8 pr-20 py-5 rounded-[2rem] focus:ring-4 focus:ring-blue-100 outline-none bg-white/70 backdrop-blur-sm border border-white/50 shadow-xl transition-all font-medium placeholder:text-slate-400"
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              id="send-btn"
              disabled={isLoading || (!input.trim() && !selectedFile)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-2xl p-3.5 hover:bg-blue-700 disabled:bg-slate-300 shadow-xl transition-all active:scale-95"
            >
              <Send size={22} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};



export default App;