# Agents Module Structure

This directory contains all AI agents organized in separate files for better code organization and maintainability.

## File Structure

```
agents/
├── __init__.py                      # Module exports
├── base.py                          # Base classes (Agent, Runner, Guardrail)
├── agent_runner.py                  # AgentRunner wrapper class
├── seo_agent.py                     # SEO Agent
├── youtube_agent.py                 # YouTube Agent
├── forbes_agent.py                  # Forbes Agent
├── web_search_agent.py             # Web Search Agent
├── daily_news_collector_agent.py    # Daily News Collector Agent
├── breaking_news_alert_agent.py     # Breaking News Alert Agent
├── news_research_agent.py           # News Research Agent
├── news_summarizer_agent.py         # News Summarizer Agent
├── multi_agent_newsroom_system.py  # Multi-Agent Newsroom System
└── ultimate_ai_news_agent.py        # Ultimate AI News Agent
```

## Base Classes (`base.py`)

- **Agent**: Core agent class following OpenAI Agents SDK pattern
- **Runner**: Session management and agent execution
- **Guardrail**: Content validation and safety
- **content_guardrail**: Common content moderation guardrail
- **seo_guardrail**: SEO quality guardrail

## Individual Agent Files

Each agent is in its own file for:
- Better code organization
- Easier maintenance
- Clear separation of concerns
- Simplified testing
- Better version control

## Usage

All agents are imported through the `__init__.py` file:

```python
from agents import (
    SEOAgent,
    YouTubeAgent,
    DailyNewsCollectorAgent,
    # ... etc
)
```

## Adding New Agents

To add a new agent:

1. Create a new file: `new_agent.py`
2. Import base classes: `from .base import Agent, content_guardrail`
3. Create the agent class following the pattern
4. Add import to `__init__.py`
5. Export in `__all__` list

Example:
```python
# new_agent.py
from .base import Agent, content_guardrail

class NewAgent:
    def __init__(self):
        self.agent = Agent(
            name="New Agent",
            instructions="Agent instructions...",
            model="gpt-4o",
            guardrails=[content_guardrail],
            tools=[]
        )
```






