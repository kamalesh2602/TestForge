from abc import ABC, abstractmethod


class Executor(ABC):
    @abstractmethod
    def execute(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:
        pass
