"""
Base classes for OpenAI Agents SDK
Using OpenAI SDK directly with a simple Agent wrapper
"""
from typing import Optional, Dict, Any, List
from openai import OpenAI, AsyncOpenAI
import os

# Try to load environment variables (ignore errors if .env file has issues)
try:
    from dotenv import load_dotenv
    import os
    # Try to load from backend directory
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(env_path)
    # Also try current directory
    load_dotenv()
except Exception:
    pass  # Environment variables may already be set

# Initialize OpenAI clients
def get_client():
    """Get OpenAI client"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return OpenAI(api_key=api_key)

def get_async_client():
    """Get async OpenAI client"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return AsyncOpenAI(api_key=api_key)


class Agent:
    """Simple Agent wrapper using OpenAI SDK"""
    
    def __init__(
        self,
        name: str,
        instructions: str,
        model: str = "gpt-4o",
        tools: Optional[list] = None,
        guardrails: Optional[list] = None
    ):
        self.name = name
        self.instructions = instructions
        self.model = model
        self.tools = tools or []
        self.guardrails = guardrails or []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert agent to dictionary for API calls"""
        return {
            "name": self.name,
            "instructions": self.instructions,
            "model": self.model,
            "tools": self.tools
        }


class Runner:
    """Simple Runner for executing agents"""
    
    @staticmethod
    async def run(agent: Agent, query: str, history: Optional[List[dict]] = None) -> Any:
        """Run an agent asynchronously. Optional history: list of {role, content} user/assistant turns."""
        try:
            async_client = get_async_client()
            messages: List[dict] = [{"role": "system", "content": agent.instructions}]
            if history:
                for msg in history:
                    r = msg.get("role")
                    c = msg.get("content")
                    if r in ("user", "assistant") and isinstance(c, str) and c.strip():
                        messages.append({"role": r, "content": c[:12000]})
            messages.append({"role": "user", "content": query})
            response = await async_client.chat.completions.create(
                model=agent.model,
                messages=messages,
                temperature=0.7
            )
            
            class Result:
                def __init__(self, final_output: str):
                    self.final_output = final_output
            
            return Result(
                final_output=response.choices[0].message.content or ""
            )
        except Exception as e:
            error_str = str(e)
            # Check for quota/rate limit errors
            if "429" in error_str or "insufficient_quota" in error_str or "quota" in error_str.lower():
                raise Exception("OpenAI API quota exceeded. Please check your OpenAI account billing and add credits. Visit https://platform.openai.com/account/billing to add credits.")
            elif "401" in error_str or "invalid_api_key" in error_str.lower():
                raise Exception("Invalid OpenAI API key. Please check your OPENAI_API_KEY in the .env file.")
            elif "rate_limit" in error_str.lower():
                raise Exception("OpenAI API rate limit exceeded. Please wait a moment and try again.")
            else:
                raise Exception(f"Error running agent: {str(e)}")
    
    @staticmethod
    def run_sync(agent: Agent, query: str, history: Optional[List[dict]] = None) -> Any:
        """Run an agent synchronously."""
        try:
            client = get_client()
            messages: List[dict] = [{"role": "system", "content": agent.instructions}]
            if history:
                for msg in history:
                    r = msg.get("role")
                    c = msg.get("content")
                    if r in ("user", "assistant") and isinstance(c, str) and c.strip():
                        messages.append({"role": r, "content": c[:12000]})
            messages.append({"role": "user", "content": query})
            response = client.chat.completions.create(
                model=agent.model,
                messages=messages,
                temperature=0.7
            )
            
            class Result:
                def __init__(self, final_output: str):
                    self.final_output = final_output
            
            return Result(
                final_output=response.choices[0].message.content or ""
            )
        except Exception as e:
            error_str = str(e)
            # Check for quota/rate limit errors
            if "429" in error_str or "insufficient_quota" in error_str or "quota" in error_str.lower():
                raise Exception("OpenAI API quota exceeded. Please check your OpenAI account billing and add credits. Visit https://platform.openai.com/account/billing to add credits.")
            elif "401" in error_str or "invalid_api_key" in error_str.lower():
                raise Exception("Invalid OpenAI API key. Please check your OPENAI_API_KEY in the .env file.")
            elif "rate_limit" in error_str.lower():
                raise Exception("OpenAI API rate limit exceeded. Please wait a moment and try again.")
            else:
                raise Exception(f"Error running agent: {str(e)}")


# Re-export for convenience
__all__ = ["Agent", "Runner", "get_client", "get_async_client"]
