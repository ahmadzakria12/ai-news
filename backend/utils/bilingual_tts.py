"""
SRS 2.4.5: bilingual mode uses English digest text + Urdu MP3 (gTTS ur).
Translates a slice of the English digest into Urdu prose suitable for TTS.
"""
import os
from openai import AsyncOpenAI


async def translate_english_to_urdu_for_tts(text: str, max_chars: int = 12_000) -> str:
    """Translate English news digest into Urdu for gTTS. Raises on empty/failure."""
    snippet = (text or "").strip()
    if not snippet:
        raise ValueError("No text to translate for Urdu audio")

    snippet = snippet[:max_chars]
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set")

    model = os.getenv("OPENAI_BILINGUAL_HELPER_MODEL", "gpt-4o-mini")
    client = AsyncOpenAI(api_key=api_key)

    resp = await client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You translate English news digests into clear, natural Urdu suitable for "
                    "Google text-to-speech. Output ONLY Urdu sentences: no title lines, no "
                    "'Translation:', no English, no markdown fences."
                ),
            },
            {"role": "user", "content": snippet},
        ],
        temperature=0.25,
        max_tokens=4096,
    )
    urdu = (resp.choices[0].message.content or "").strip()
    if not urdu:
        raise RuntimeError("Urdu translation for TTS was empty")
    return urdu
