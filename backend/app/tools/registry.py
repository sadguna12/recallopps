import json
import time
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.tools.base import BaseTool
from backend.app.tools.diagnostic_tools import (
    GetLogsTool, CheckServiceHealthTool, GetMetricsTool,
    CheckDatabaseConnectionsTool, CheckDeploymentTool
)
from backend.app.tools.remediation_tools import (
    RestartServiceTool, RollbackDeploymentTool, ScaleServiceTool
)
from backend.app.tools.memory_tools import (
    SearchIncidentsTool, SearchRunbooksTool, SearchPostmortemsTool,
    VerifyResolutionTool, StoreIncidentMemoryTool, UpdateIncidentTool
)
from backend.app.models.agent import ToolExecution

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_all_tools()

    def _register_all_tools(self):
        tools = [
            GetLogsTool(),
            CheckServiceHealthTool(),
            GetMetricsTool(),
            CheckDatabaseConnectionsTool(),
            CheckDeploymentTool(),
            RestartServiceTool(),
            RollbackDeploymentTool(),
            ScaleServiceTool(),
            SearchIncidentsTool(),
            SearchRunbooksTool(),
            SearchPostmortemsTool(),
            VerifyResolutionTool(),
            StoreIncidentMemoryTool(),
            UpdateIncidentTool()
        ]
        for t in tools:
            self._tools[t.name] = t

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        return [t.to_schema() for t in self._tools.values()]

    def execute_tool(
        self,
        db: Session,
        tool_name: str,
        parameters: Dict[str, Any],
        incident_id: Optional[str] = None,
        action_id: Optional[str] = None
    ) -> Dict[str, Any]:
        tool = self.get_tool(tool_name)
        if not tool:
            return {
                "success": False,
                "error": f"Tool '{tool_name}' not found in registry."
            }

        start_time = time.time()
        exec_id = f"TOOL-{int(time.time()*1000)%1000000:06d}"
        status = "SUCCESS"
        error_msg = None
        result = {}

        try:
            result = tool.execute(db, **parameters)
        except Exception as e:
            status = "FAILED"
            error_msg = str(e)
            result = {"error": error_msg}

        duration_ms = int((time.time() - start_time) * 1000)

        # Persist tool execution record
        try:
            tool_rec = ToolExecution(
                id=exec_id,
                action_id=action_id,
                incident_id=incident_id,
                tool_name=tool_name,
                tool_input_json=json.dumps(parameters),
                tool_output_json=json.dumps(result),
                status=status,
                error_message=error_msg,
                execution_time_ms=duration_ms
            )
            db.add(tool_rec)
            db.commit()
        except Exception as e:
            print(f"[ToolRegistry] Warning persisting tool execution log: {e}")

        return {
            "execution_id": exec_id,
            "tool_name": tool_name,
            "status": status,
            "duration_ms": duration_ms,
            "output": result
        }

tool_registry = ToolRegistry()
