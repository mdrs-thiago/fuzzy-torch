import torch
import torch.nn as nn
from typing import Callable

class Defuzzification(nn.Module):
    """
    Base class for Defuzzification methods.
    """
    def __init__(self, universe_min: float, universe_max: float, resolution: int = 100):
        super().__init__()
        self.universe_min = universe_min
        self.universe_max = universe_max
        self.resolution = resolution
        # Create a static grid for numerical integration/operations
        self.register_buffer('universe', torch.linspace(universe_min, universe_max, resolution))

    def forward(self, aggregated_mf: Callable[[torch.Tensor], torch.Tensor]) -> torch.Tensor:
        """
        aggregated_mf: A callable (or combined MF) that takes the universe tensor 
                       and returns membership degrees. 
                       In our system, we might pass the actual values of the aggregated set 
                       evaluated on the universe to avoid re-calculation if possible,
                       but for generality, let's assume we pass the values directly.
        """
        raise NotImplementedError

class Centroid(Defuzzification):
    def forward(self, membership_values: torch.Tensor) -> torch.Tensor:
        """
        membership_values: Tensor of shape (batch, resolution) representing 
                           the aggregated fuzzy set evaluated on self.universe.
        """
        # COG = sum(x * u(x)) / sum(u(x))
        numerator = torch.sum(self.universe * membership_values, dim=-1)
        denominator = torch.sum(membership_values, dim=-1)
        
        # Avoid division by zero
        return numerator / (denominator + 1e-8)

class Bisector(Defuzzification):
    def forward(self, membership_values: torch.Tensor) -> torch.Tensor:
        """
        Bisector: The value x that splits the area under the curve in two equal halves.
        Note: This is harder to implement efficiently in specialized batched scenarios merely with basic ops,
        simulating via cumulative sum.
        """
        cumulative_area = torch.cumsum(membership_values, dim=-1)
        total_area = cumulative_area[..., -1:]
        half_area = total_area / 2.0
        
        # Find index where cumulative area >= half_area
        # This is argmin(abs(cumulative - half))
        diff = torch.abs(cumulative_area - half_area)
        idx = torch.argmin(diff, dim=-1)
        
        return self.universe[idx]

class MeanOfMaximum(Defuzzification):
    def forward(self, membership_values: torch.Tensor) -> torch.Tensor:
        """
        MOM: Average of the x values with maximal membership.
        """
        max_val, _ = torch.max(membership_values, dim=-1, keepdim=True)
        # Create a mask for values close to max (handling float precision)
        mask = (membership_values >= (max_val - 1e-5)).float()
        
        sum_x_max = torch.sum(self.universe * mask, dim=-1)
        count_max = torch.sum(mask, dim=-1)
        
        return sum_x_max / (count_max + 1e-8)
