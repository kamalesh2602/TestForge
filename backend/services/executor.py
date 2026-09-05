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

    @abstractmethod
    def execute_java(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:
        pass

    @abstractmethod
    def execute_java_function(
        self,
        code: str,
        timeout: int = 5,
    ) -> dict:
        pass

    @abstractmethod
    def execute_javascript(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:
        pass

    @abstractmethod
    def execute_javascript_function(
        self,
        code: str,
        timeout: int = 5,
    ) -> dict:
        pass

    @abstractmethod
    def validate_java(
        self,
        code: str,
    ) -> dict:
        pass

    @abstractmethod
    def validate_javascript(
        self,
        code: str,
    ) -> dict:
        pass
