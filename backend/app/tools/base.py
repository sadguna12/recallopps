from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

class BaseTool(ABC):
    name: str
    description: str
    is_risky: bool = False # If True, requires human approval before execution
    parameters_schema: Dict[str, Any]

    @abstractmethod
    def execute(self, db: Session, **kwargs) -> Dict[str, Any]:
        """Executes the tool with database session and kwargs."""
        pass

    def to_schema(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "is_risky": self.is_risky,
            "parameters": self.parameters_schema
        }
