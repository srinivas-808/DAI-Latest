import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/diagnos_ai")
# If deploying on Render and using Atlas, this URI should be present in the environment variables

# We provide both synchronous and asynchronous clients
# Sync client for simple operations if needed
sync_client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db_sync = sync_client.get_database()

# Async client for FastAPI routes
async_client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
db = async_client.get_database()

# Collections
conversations_collection = db["conversations"]
messages_collection = db["messages"]

# Optional: Add simple functions to ensure indexes
async def init_db():
    # Ensures faster fetching by conversation_id
    await messages_collection.create_index("conversation_id")
    await conversations_collection.create_index("user_id")
