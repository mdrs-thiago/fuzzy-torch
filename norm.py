import torch
import torch.nn as nn
from abc import ABC, abstractmethod

class TNorm(ABC):
    """Abstract Base Class for T-Norms (Intersection/AND)."""
    @abstractmethod
    def forward(self, x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
        pass
    
    def __call__(self, x, y):
        return self.forward(x, y)

class SNorm(ABC):
    """Abstract Base Class for S-Norms (Union/OR)."""
    @abstractmethod
    def forward(self, x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
        pass

    def __call__(self, x, y):
        return self.forward(x, y)

class Min(TNorm):
    def forward(self, x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
        return torch.min(x, y)

class Max(SNorm):
    def forward(self, x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
        return torch.max(x, y)

class Product(TNorm):
    def forward(self, x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
        return x * y

class ProbabilisticSum(SNorm):
    def forward(self, x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
        return x + y - (x * y)

class Lukasiewicz(TNorm):
    def forward(self, x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
        return torch.max(torch.tensor(0.0, device=x.device), x + y - 1)
