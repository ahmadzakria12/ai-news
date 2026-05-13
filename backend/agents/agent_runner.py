"""
Agent Runner - Wrapper for running agents with session management
"""
from typing import Optional, Any
import uuid
from .base import Runner


class AgentRunner:
    """Wrapper for Runner to maintain compatibility with our agent structure"""

    def __init__(self, session_store: Optional[Any] = None):
        self._session_store = session_store
    
    def create_session_id(self) -> str:
        """Create a new session ID"""
        return str(uuid.uuid4())
    
    async def run_async(
        self,
        agent: Any,
        query: str,
        session_id: Optional[str] = None,
        use_memory: bool = True,
    ):
        """Run an agent asynchronously. use_memory=False skips chat history read/write (e.g. /api/news batch)."""
        try:
            # Handle both agent objects with .agent attribute and direct Agent instances
            agent_instance = agent.agent if hasattr(agent, 'agent') else agent
            
            if agent_instance is None:
                raise ValueError("Agent instance is None")

            sid = session_id or self.create_session_id()
            history: list = []
            if use_memory and self._session_store is not None:
                history = self._session_store.get_history_messages(
                    session_id if session_id else sid
                )

            result = await Runner.run(agent_instance, query, history=history or None)
            
            if result is None or not hasattr(result, 'final_output'):
                raise ValueError("Invalid result from Runner.run")
            
            # Create a result object with session_id for compatibility
            class Result:
                def __init__(self, final_output: str, session_id: str):
                    self.final_output = final_output
                    self.session_id = session_id
            
            out = result.final_output or ""
            if use_memory and self._session_store is not None:
                self._session_store.append_turn(
                    session_id if session_id else sid, query, out
                )

            return Result(
                final_output=out,
                session_id=sid
            )
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Error in AgentRunner.run_async: {e}\n{error_details}")
            raise Exception(f"Error running agent: {str(e)}")
    
    def run_sync(
        self,
        agent: Any,
        query: str,
        session_id: Optional[str] = None,
        use_memory: bool = True,
    ):
        """Run an agent synchronously"""
        agent_instance = agent.agent if hasattr(agent, 'agent') else agent
        sid = session_id or self.create_session_id()
        history: list = []
        if use_memory and self._session_store is not None:
            history = self._session_store.get_history_messages(
                session_id if session_id else sid
            )
        result = Runner.run_sync(agent_instance, query, history=history or None)
        
        # Create a result object with session_id for compatibility
        class Result:
            def __init__(self, final_output: str, session_id: str):
                self.final_output = final_output
                self.session_id = session_id
        
        out = result.final_output or ""
        if use_memory and self._session_store is not None:
            self._session_store.append_turn(
                session_id if session_id else sid, query, out
            )
        return Result(
            final_output=out,
            session_id=sid
        )

