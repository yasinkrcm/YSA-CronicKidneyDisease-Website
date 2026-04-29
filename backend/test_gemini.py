import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def test():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("No API KEY")
        return
    
    prompt = "Test prompt"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={api_key}"
    print(f"URL: {url}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}]
                }
            )
            print("Status:", response.status_code)
            print("Response:", response.text)
    except Exception as e:
        import traceback
        print("EXCEPTION:", repr(e))
        traceback.print_exc()

asyncio.run(test())
