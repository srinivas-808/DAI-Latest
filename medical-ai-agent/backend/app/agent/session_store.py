from collections import defaultdict
import threading
import time

# ============================
# Session Memory Store
# ============================
# session_id -> list of messages
# Each message: {"role": "user"|"assistant", "content": str}
SESSION_MEMORY = defaultdict(list)

# Track session creation times for cleanup
SESSION_TIMESTAMPS = defaultdict(float)

# Maximum sessions to keep in memory
MAX_SESSIONS = 100

# Session expiry time (2 hours)
SESSION_EXPIRY_SECONDS = 7200

# Lock for thread-safe operations
_lock = threading.Lock()


def cleanup_old_sessions():
    """Remove sessions older than SESSION_EXPIRY_SECONDS."""
    with _lock:
        now = time.time()
        expired = [
            sid for sid, ts in SESSION_TIMESTAMPS.items()
            if now - ts > SESSION_EXPIRY_SECONDS
        ]
        for sid in expired:
            SESSION_MEMORY.pop(sid, None)
            SESSION_TIMESTAMPS.pop(sid, None)
        
        # If still too many sessions, remove oldest
        if len(SESSION_MEMORY) > MAX_SESSIONS:
            sorted_sessions = sorted(SESSION_TIMESTAMPS.items(), key=lambda x: x[1])
            to_remove = len(SESSION_MEMORY) - MAX_SESSIONS
            for sid, _ in sorted_sessions[:to_remove]:
                SESSION_MEMORY.pop(sid, None)
                SESSION_TIMESTAMPS.pop(sid, None)


def get_session(session_id: str) -> list:
    """Get or create a session, updating its timestamp."""
    SESSION_TIMESTAMPS[session_id] = time.time()
    
    # Periodic cleanup (every ~50 accesses)
    if len(SESSION_MEMORY) > MAX_SESSIONS // 2:
        cleanup_old_sessions()
    
    return SESSION_MEMORY[session_id]
