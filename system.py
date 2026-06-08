import torch
import torch.nn as nn
from typing import Dict, List, Union
from .variable import FuzzyVariable
from .rule import FuzzyRule
from .norm import SNorm, Max
from .defuzz import Defuzzification, Centroid

class FuzzyModule(nn.Module):
    """
    Main Fuzzy Inference System Module.
    Inherits from nn.Module to support parameter optimization and GPU usage.
    """
    def __init__(self, 
                 inputs: List[FuzzyVariable], 
                 output: FuzzyVariable, 
                 rules: List[FuzzyRule],
                 defuzz_method: Defuzzification = None):
        super().__init__()
        self.input_variables = nn.ModuleDict({v.name: v for v in inputs})
        self.output_variable = output
        self.rules = nn.ModuleList(rules)
        self.defuzz = defuzz_method if defuzz_method else Centroid(output.range_min, output.range_max)
        
        # S-Norm for aggregation of rule outputs (usually Max)
        self.aggregation = Max()

    def get_rule_activations(self, x: Dict[str, torch.Tensor]) -> torch.Tensor:
        """
        Returns a tensor of firing strengths for each rule.
        """
        activations = []
        for rule in self.rules:
            # Rule forward returns firing strength (scalar per batch item)
            activations.append(rule(x))
        return torch.stack(activations, dim=1) # (batch, num_rules)

    def forward(self, x: Dict[str, torch.Tensor]) -> torch.Tensor:
        """
        x: Dictionary mapping input variable names to tensors (batch_size, or scalar).
        Returns: Crisp output tensor (batch_size,).
        """
        batch_size = next(iter(x.values())).shape[0] if x else 1
        
        # 1. Evaluate Rules (get firing strengths)
        rule_activations = self.get_rule_activations(x) # (batch, num_rules)
        
        # 2. Implication & Aggregation
        # For each rule, clip the consequent MF by the firing strength.
        # Then aggregate (max) across all rules.
        
        # We evaluate on the defuzzification grid
        universe = self.defuzz.universe # (resolution,)
        # Reshape universe for broadcasting: (1, 1, resolution)
        universe = universe.unsqueeze(0).unsqueeze(0)
        
        # Output fuzzy set accumulator
        aggregated_mf = torch.zeros((batch_size, self.defuzz.resolution), device=universe.device)
        
        # This implementation iterates rules. For massive rule bases, this could be vectorized 
        # if rules shared the same consequent structure, but for general cases iteration is safer.
        for i, rule in enumerate(self.rules):
            strength = rule_activations[:, i].unsqueeze(-1) # (batch, 1)
            
            # Consequent MF
            full_cons_term = self.output_variable.terms[rule.consequent[1]]
            cons_mf_values = full_cons_term(universe) # (1, 1, resolution) -> broadcasts to (1, 1, resolution) actually logic inside MF handles variable implementation
            # Fix: MF expects input of shape (B,...). 
            # We want to eval consequent MF on the universe grid.
            # MF forward takes (resolution,) -> returns (resolution,)
            # We wrap it to handle batching? Actually MF is stateless regarding batch usually.
            cons_mf_values = full_cons_term(self.defuzz.universe).unsqueeze(0) # (1, resolution)
            
            # Mamdani Implication: Min(strength, consequent_mf)
            # Typically using Min for implication
            rule_output = torch.min(strength, cons_mf_values) # (batch, resolution)
            
            # Aggregation: Max(rule_output, aggregated)
            if i == 0:
                aggregated_mf = rule_output
            else:
                aggregated_mf = self.aggregation(aggregated_mf, rule_output)
                
        # 3. Defuzzification
        crisp_output = self.defuzz(aggregated_mf)
        return crisp_output

    def print_rules(self):
        """Prints all rules in a human-readable format."""
        print("Fuzzy System Rules:")
        for i, rule in enumerate(self.rules):
            print(f"Rule {i+1}: {rule}")

    def explain(self, x: Dict[str, torch.Tensor], threshold: float = 0.01):
        """
        Prints detailed explanation of inference for a specific input.
        """
        # Ensure x is single item for clear explanation or handle first item of batch
        print("\n--- Inference Explanation ---")
        
        # 1. Show Inputs
        print("Inputs:")
        for k, v in x.items():
            val = v.item() if v.numel() == 1 else v[0].item()
            print(f"  {k}: {val:.4f}")
            
        activations = self.get_rule_activations(x) # (batch, num_rules)
        if activations.dim() > 1:
            activations = activations[0] # Take first item
            
        print("\nRule Activations:")
        triggered_rules = 0
        for i, rule in enumerate(self.rules):
            act = activations[i].item()
            if act > threshold:
                triggered_rules += 1
                print(f"  Rule {i+1}: {rule} [Strength: {act:.4f}]")
                # Introspect antecedents
                for var, term in rule.antecedent:
                    val = x[var.name].item() if x[var.name].numel() == 1 else x[var.name][0].item()
                    mem = var.terms[term](torch.tensor(val)).item()
                    print(f"    - {var.name} is {term} (val={val:.2f}) -> {mem:.4f}")

        if triggered_rules == 0:
            print("  No rules triggered significantly.")
            
        # Run full forward to get output
        out = self.forward(x)
        out_val = out.item() if out.numel() == 1 else out[0].item()
        print(f"\nFinal Output ({self.output_variable.name}): {out_val:.4f}")
