import asyncio
import json
import logging
import re
from pathlib import Path
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

PROMPT_DIR = Path(__file__).parent.parent / "prompts"

def load_prompt(name: str) -> str:
    path = PROMPT_DIR / f"{name}.txt"
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""

class AIService:
    def __init__(
        self,
        provider: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
        api_key: str | None = None,
    ):
        self.provider = (provider or settings.ai_provider).lower()
        if self.provider in ("groq", "grok"):
            self.base_url = (
                base_url
                or (
                    settings.ai_base_url
                    if settings.ai_base_url != "https://api.openai.com/v1"
                    else "https://api.groq.com/openai/v1"
                )
            ).rstrip("/")
            self.model = model or (
                settings.ai_model
                if settings.ai_model not in ("gpt-4o-mini", "")
                else "qwen/qwen3.8-27b"
            )
            self.api_key = (
                api_key
                or settings.groq_api_key
                or settings.grok_api_key
                or settings.ai_api_key
            )
        elif self.provider == "openrouter":
            self.base_url = (
                base_url
                or (
                    settings.ai_base_url
                    if settings.ai_base_url != "https://api.openai.com/v1"
                    else "https://openrouter.ai/api/v1"
                )
            ).rstrip("/")
            self.model = model or (
                settings.ai_model
                if settings.ai_model not in ("gpt-4o-mini", "")
                else "qwen/qwen-2.5-7b-instruct"
            )
            self.api_key = (
                api_key
                or settings.openrouter_api_key
                or settings.ai_api_key
            )
        else:
            self.base_url = (base_url or settings.effective_ai_base_url).rstrip("/")
            self.model = model or settings.effective_ai_model
            self.api_key = api_key or settings.effective_ai_api_key

        self.timeout = settings.ai_timeout

    async def generate_json(self, system_prompt: str, user_prompt: str) -> dict | None:
        """Convenience method for single-turn prompt."""
        return await self.generate_chat_json(
            system_prompt=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )

    async def generate_chat_json(
        self,
        system_prompt: str,
        messages: list[dict],
        max_tokens: int | None = None,
    ) -> dict | None:
        """Call OpenAI-compatible chat completion endpoint with multi-turn messages array asking for JSON."""
        if not self.api_key or self.api_key.strip() in ("", "your-api-key", "none"):
            logger.info("No AI API key configured, falling back to rule-based mock engine.")
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if "openrouter" in self.base_url:
            headers["HTTP-Referer"] = "http://localhost:3000"
            headers["X-Title"] = "Viet Phuc Remix"

        full_messages = [{"role": "system", "content": system_prompt}] + messages

        payload = {
            "model": self.model,
            "messages": full_messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.7,
            "max_tokens": max_tokens or settings.ai_max_tokens or 800,
        }

        async def _call_api(req_payload: dict) -> httpx.Response | None:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=req_payload,
                    )
                    if res.status_code == 400 and ("response_format" in res.text.lower() or "json_validate_failed" in res.text.lower()):
                        logger.info("Retrying without response_format and higher max_tokens for model %s", req_payload.get("model"))
                        retry_p = dict(req_payload)
                        retry_p.pop("response_format", None)
                        retry_p["max_tokens"] = max(req_payload.get("max_tokens", 800), 1200)
                        res = await client.post(
                            f"{self.base_url}/chat/completions",
                            headers=headers,
                            json=retry_p,
                        )
                    return res
            except Exception as e:
                logger.error(f"Error calling AI Service: {e}")
                return None

        try:
            res = await _call_api(payload)
            if not res:
                return None

            # Handle 429 Rate Limit with Auto-retry
            if res.status_code == 429:
                logger.warning(f"429 Rate limit hit on {self.model}. Auto-retrying in 2.5 seconds...")
                await asyncio.sleep(2.5)
                res = await _call_api(payload)
                if not res:
                    return None

                # If still 429 on groq with qwen, try graceful model fallback to high-quota model
                if res.status_code == 429 and "groq" in self.base_url and self.model != "openai/gpt-oss-120b":
                    logger.warning("Still 429 on %s, attempting fallback to high-quota model openai/gpt-oss-120b...", self.model)
                    fallback_payload = dict(payload)
                    fallback_payload["model"] = "openai/gpt-oss-120b"
                    fallback_payload.pop("response_format", None)
                    res = await _call_api(fallback_payload)
                    if not res:
                        return None

            if res.status_code != 200:
                logger.warning(f"AI Service API error {res.status_code}: {res.text}")
                return None

            data = res.json()
            choices = data.get("choices")
            if not choices or not isinstance(choices, list):
                logger.warning("AI response missing choices array")
                return None
            content = choices[0].get("message", {}).get("content")
            if not content:
                logger.warning("AI response content is empty/null")
                return None

            # 1. Clean Qwen/DeepSeek reasoning/thinking tokens (<think>...</think>)
            cleaned = re.sub(r"<think>[\s\S]*?</think>", "", content).strip()

            # 2. Clean markdown code wraps (```json ... ``` or ``` ... ```)
            cleaned = re.sub(r"^```(?:json|JSON)?\s*\n?", "", cleaned)
            cleaned = re.sub(r"\n?\s*```$", "", cleaned).strip()

            # 3. Direct JSON parse or search for first bracketed JSON object
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError:
                match = re.search(r"(\{[\s\S]*\})", cleaned)
                if match:
                    return json.loads(match.group(1))
                raise
        except json.JSONDecodeError as e:
            logger.warning(f"AI returned invalid JSON: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in AIService: {e}")
            return None
