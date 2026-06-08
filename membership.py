import torch
import torch.nn as nn
import math

class MembershipFunction(nn.Module):
    """Base class for Membership Functions."""
    def __init__(self):
        super().__init__()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        raise NotImplementedError

class TriangularMF(MembershipFunction):
    def __init__(self, a, b, c):
        super().__init__()
        self.a = nn.Parameter(torch.as_tensor(a, dtype=torch.float32))
        self.b = nn.Parameter(torch.as_tensor(b, dtype=torch.float32))
        self.c = nn.Parameter(torch.as_tensor(c, dtype=torch.float32))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # trimf(x; a, b, c) = max(min((x-a)/(b-a), (c-x)/(c-b)), 0)
        # Handle division by zero edge cases safely if needed, but standard logic implies distinct points
        left_slope = (x - self.a) / (self.b - self.a + 1e-6)
        right_slope = (self.c - x) / (self.c - self.b + 1e-6)
        return torch.max(torch.min(left_slope, right_slope), torch.zeros_like(x))

class TrapezoidalMF(MembershipFunction):
    def __init__(self, a, b, c, d):
        super().__init__()
        self.a = nn.Parameter(torch.as_tensor(a, dtype=torch.float32))
        self.b = nn.Parameter(torch.as_tensor(b, dtype=torch.float32))
        self.c = nn.Parameter(torch.as_tensor(c, dtype=torch.float32))
        self.d = nn.Parameter(torch.as_tensor(d, dtype=torch.float32))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # trapmf(x; a, b, c, d) = max(min((x-a)/(b-a), 1, (d-x)/(d-c)), 0)
        left_slope = (x - self.a) / (self.b - self.a + 1e-6)
        right_slope = (self.d - x) / (self.d - self.c + 1e-6)
        ones = torch.ones_like(x)
        return torch.max(torch.min(torch.min(left_slope, ones), right_slope), torch.zeros_like(x))

class GaussianMF(MembershipFunction):
    def __init__(self, mu, sigma):
        super().__init__()
        self.mu = nn.Parameter(torch.as_tensor(mu, dtype=torch.float32))
        self.sigma = nn.Parameter(torch.as_tensor(sigma, dtype=torch.float32))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return torch.exp(-0.5 * ((x - self.mu) / (self.sigma + 1e-6)) ** 2)

class BellMF(MembershipFunction):
    def __init__(self, a, b, c):
        super().__init__()
        self.a = nn.Parameter(torch.as_tensor(a, dtype=torch.float32))
        self.b = nn.Parameter(torch.as_tensor(b, dtype=torch.float32))
        self.c = nn.Parameter(torch.as_tensor(c, dtype=torch.float32))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # gbellmf(x; a, b, c) = 1 / (1 + |(x-c)/a|^(2b))
        return 1.0 / (1.0 + torch.pow(torch.abs((x - self.c) / (self.a + 1e-6)), 2 * self.b))

class SigmoidMF(MembershipFunction):
    def __init__(self, b, c):
        super().__init__()
        self.b = nn.Parameter(torch.as_tensor(b, dtype=torch.float32)) # slope
        self.c = nn.Parameter(torch.as_tensor(c, dtype=torch.float32)) # center

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return 1.0 / (1.0 + torch.exp(-self.b * (x - self.c)))
