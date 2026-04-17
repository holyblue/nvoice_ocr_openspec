"""
Script to verify Gemma 4 endpoint connectivity.
Usage: uv run python scripts/test_gemma_connection.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from openai import AsyncOpenAI
from app.config import settings


async def main():
    print(f"Testing Gemma endpoint: {settings.gemma_endpoint_url}")
    print(f"Model: {settings.gemma_model_name}")

    client = AsyncOpenAI(
        base_url=settings.gemma_endpoint_url,
        api_key=settings.gemma_api_key,
    )

    try:
        response = await client.chat.completions.create(
            model=settings.gemma_model_name,
            messages=[{"role": "user", "content": "Reply with: OK"}],
            max_tokens=10,
        )
        reply = response.choices[0].message.content
        print(f"Response: {reply}")
        print("Connection OK")
    except Exception as e:
        print(f"Connection FAILED: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
