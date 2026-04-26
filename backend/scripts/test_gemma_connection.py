"""
Script to verify Gemma 4 endpoint connectivity via google-genai SDK.
Usage: uv run python scripts/test_gemma_connection.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from google import genai
from app.config import settings


async def main():
    print(f"Model: {settings.gemma_model_name}")
    print(f"Thinking level: {settings.gemma_thinking_level}")

    client = genai.Client(api_key=settings.gemma_api_key)

    try:
        response = await client.aio.models.generate_content(
            model=settings.gemma_model_name,
            contents="Reply with: OK",
        )
        print(f"Response: {response.text}")
        print("Connection OK")
    except Exception as e:
        print(f"Connection FAILED: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
