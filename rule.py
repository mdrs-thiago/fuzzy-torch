import torch
import torch.nn as nn
from typing import List, Union, Tuple, Dict
from .norm import TNorm, Min
from .variable import FuzzyVariable

class FuzzyRule(nn.Module):
    """
    Represents a fuzzy rule of the form:
    IF (ant1 IS term1) [AND/OR (ant2 IS term2) ...] THEN (consequent IS term_out)
    """
    def __init__(self, antecedent, consequent, t_norm: TNorm = None):
        """
        antecedent: A complex structure defining the condition.
                    Can be a tuple (FuzzyVariable, term_name) for a single proposition.
                    Or a list of tuples for AND connections (simplified version).
                    For complex logic, we might need a tree structure, but starting simple:
                    List[(FuzzyVariable, str)] -> interpreted as AND connected.
        consequent: Tuple (FuzzyVariable, str) -> The output variable and term.
        t_norm: The T-Norm to use for AND operations. Defaults to Min.
        """
        super().__init__()
        # Ensure antecedent is a list
        if isinstance(antecedent, tuple):
             self.antecedent = [antecedent]
        else:
             self.antecedent = antecedent
            
        self.consequent = consequent
        self.t_norm = t_norm if t_norm else Min()

    def forward(self, inputs: Dict[str, torch.Tensor]) -> torch.Tensor:
        """
        Calculates the firing strength of the rule based on inputs.
        inputs: Dictionary where keys are FuzzyVariable names and values are input tensors.
        """
        firing_strength = None
        
        for var, term in self.antecedent:
            # 1. Get the input value for this variable
            if var.name not in inputs:
                raise ValueError(f"Input for variable '{var.name}' not provided.")
            
            x = inputs[var.name]
            
            # 2. Fuzzify (compute membership)
            membership = var.terms[term](x)
            
            # 3. Combine with previous antecedent parts (AND connection)
            if firing_strength is None:
                firing_strength = membership
            else:
                firing_strength = self.t_norm(firing_strength, membership)
        
        return firing_strength

    def __repr__(self):
        ant_str = " AND ".join([f"({var.name} IS '{term}')" for var, term in self.antecedent])
        cons_str = f"({self.consequent[0].name} IS '{self.consequent[1]}')"
        return f"IF {ant_str} THEN {cons_str}"
