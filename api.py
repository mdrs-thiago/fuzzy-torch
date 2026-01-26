import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Union, Optional, Any
from fuzzy_torch import FuzzyModule, FuzzyVariable, FuzzyRule, TriangularMF, TrapezoidalMF, GaussianMF, BellMF, SigmoidMF
from fuzzy_torch.defuzz import Centroid

app = FastAPI(title="Fuzzy Inference System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global State (Builder Pattern) ---
class FuzzyBuilder:
    def __init__(self):
        self.variables: Dict[str, FuzzyVariable] = {}
        self.roles: Dict[str, str] = {} # var_name -> 'input' | 'output'
        self.rules_data: List[Dict] = [] # Store raw rule config for reconstruction
        self.system: Optional[FuzzyModule] = None
        self.dirty = False # Flag to rebuild system

    def get_variable(self, name: str):
        if name not in self.variables:
            raise HTTPException(status_code=404, detail=f"Variable '{name}' not found")
        return self.variables[name]

    def delete_variable(self, name: str):
        if name in self.variables:
            del self.variables[name]
        if name in self.roles:
            del self.roles[name]
        # Remove rules referencing this variable
        self.rules_data = [
            r for r in self.rules_data 
            if name not in r['antecedents'] and name not in r['consequent']
        ]
        self.system = None

    def delete_term(self, var_name: str, term_name: str):
        var = self.get_variable(var_name)
        if term_name in var.terms:
            del var.terms[term_name]
        # Remove rules referencing this term
        self.rules_data = [
            r for r in self.rules_data 
            if r['antecedents'].get(var_name) != term_name and r['consequent'].get(var_name) != term_name
        ]
        self.system = None

    def delete_rule(self, index: int):
        if 0 <= index < len(self.rules_data):
            self.rules_data.pop(index)
        self.system = None

builder = FuzzyBuilder()

# --- Pydantic Models ---
class CreateVariable(BaseModel):
    name: str
    min_val: float
    max_val: float
    role: str = "input" # input or output

class CreateMF(BaseModel):
    name: str
    type: str  # tri, trap, gauss, bell, sig
    params: List[float]

class CreateRule(BaseModel):
    antecedents: Dict[str, str] # {VarName: TermName}
    consequent: Dict[str, str]  # {VarName: TermName} (Single consequent for now)

class SimulateRequest(BaseModel):
    inputs: Dict[str, float]

class SystemConfig(BaseModel):
    variables: Dict[str, CreateVariable] # Reuse logic roughly, or define better structure. 
    # Actually, export format might differ from create logic.
    # Let's define a schema for Variable Dump
    pass

# --- Endpoints ---

@app.get("/config")
def get_config():
    """Returns current system configuration."""
    vars_out = {}
    for name, var in builder.variables.items():
        terms = {}
        for t_name, mf in var.terms.items():
            # Extract params based on type
            params = []
            mf_type = type(mf).__name__
            if isinstance(mf, TriangularMF):
                params = [mf.a.item(), mf.b.item(), mf.c.item()]
            elif isinstance(mf, TrapezoidalMF):
                params = [mf.a.item(), mf.b.item(), mf.c.item(), mf.d.item()]
            elif isinstance(mf, GaussianMF):
                params = [mf.mu.item(), mf.sigma.item()]
            
            terms[t_name] = {"type": mf_type, "params": params}
            
        vars_out[name] = {
            "min": var.range_min,
            "max": var.range_max,
            "role": builder.roles.get(name, "input"),
            "terms": terms
        }
        
    return {
        "variables": vars_out,
        "rules": builder.rules_data
    }

@app.get("/export")
def export_system():
    """Export the full system configuration."""
    # We can reuse the get_config logic but structure it for re-import
    # Or just return the raw builder state that creates it.
    
    # Let's try to return a structure that mimics what we need to rebuild.
    # For now, let's just dump the internal state in a clean JSON way.
    
    # 1. Variables & Terms
    vars_export = {}
    for name, var in builder.variables.items():
        terms = []
        for t_name, mf in var.terms.items():
            params = []
            mf_type = type(mf).__name__
            if isinstance(mf, TriangularMF): params = [mf.a.item(), mf.b.item(), mf.c.item()]
            elif isinstance(mf, TrapezoidalMF): params = [mf.a.item(), mf.b.item(), mf.c.item(), mf.d.item()]
            elif isinstance(mf, GaussianMF): params = [mf.mu.item(), mf.sigma.item()]
            # ... others
            terms.append({"name": t_name, "type": mf_type, "params": params})
            
        vars_export[name] = {
            "min": var.range_min,
            "max": var.range_max,
            "role": builder.roles.get(name, "input"),
            "terms": terms
        }
        
    return {
        "variables": vars_export,
        "rules": builder.rules_data
    }

@app.post("/import")
def import_system(config: Dict[str, Any]):
    """Restores system from config."""
    try:
        # Reset first
        builder.variables = {}
        builder.roles = {}
        builder.rules_data = []
        builder.system = None
        
        # 1. Restore Variables
        for name, data in config.get("variables", {}).items():
            var = FuzzyVariable(name, data["min"], data["max"])
            builder.variables[name] = var
            builder.roles[name] = data.get("role", "input")
            
            # Restore Terms
            for term in data.get("terms", []):
                mf = None
                p = term["params"]
                t_type = term["type"]
                # Mapping type names from export back to classes
                if "TriangularMF" in t_type or t_type == "tri": mf = TriangularMF(p[0], p[1], p[2])
                elif "TrapezoidalMF" in t_type or t_type == "trap": mf = TrapezoidalMF(p[0], p[1], p[2], p[3])
                elif "GaussianMF" in t_type or t_type == "gauss": mf = GaussianMF(p[0], p[1])
                # ... others
                
                if mf: var.add_term(term["name"], mf)
                
        # 2. Restore Rules
        builder.rules_data = config.get("rules", [])
        
        return {"message": "System imported successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

@app.post("/reset")
def reset_system():
    builder.variables = {}
    builder.roles = {}
    builder.rules_data = []
    builder.system = None
    return {"message": "System reset"}

@app.post("/variable")
def create_variable(data: CreateVariable):
    builder.variables[data.name] = FuzzyVariable(data.name, data.min_val, data.max_val)
    builder.roles[data.name] = data.role
    return {"message": f"Variable {data.name} created"}

@app.delete("/variable/{name}")
def delete_variable(name: str):
    builder.delete_variable(name)
    return {"message": f"Variable {name} deleted"}

@app.delete("/variable/{name}/term/{term}")
def delete_term(name: str, term: str):
    builder.delete_term(name, term)
    return {"message": f"Term {term} deleted from {name}"}

@app.delete("/rule/{index}")
def delete_rule(index: int):
    builder.delete_rule(index)
    return {"message": f"Rule {index} deleted"}

@app.post("/variable/{name}/term")
def add_term(name: str, data: CreateMF):
    var = builder.get_variable(name)
    
    mf = None
    p = data.params
    if data.type == "tri":
        mf = TriangularMF(p[0], p[1], p[2])
    elif data.type == "trap":
        mf = TrapezoidalMF(p[0], p[1], p[2], p[3])
    elif data.type == "gauss":
        mf = GaussianMF(p[0], p[1])
    elif data.type == "bell":
        mf = BellMF(p[0], p[1], p[2])
    elif data.type == "sig":
        mf = SigmoidMF(p[0], p[1])
    else:
        raise HTTPException(status_code=400, detail="Unknown MF type")
        
    var.add_term(data.name, mf)
    return {"message": f"Term {data.name} added to {name}"}

@app.post("/rule")
def add_rule(data: CreateRule):
    # Just store for now, validate existence
    for v, t in data.antecedents.items():
        if v not in builder.variables or t not in builder.variables[v].terms:
             raise HTTPException(status_code=400, detail=f"Invalid antecedent {v}:{t}")
    
    cons_var = list(data.consequent.keys())[0]
    cons_term = list(data.consequent.values())[0]
    if cons_var not in builder.variables or cons_term not in builder.variables[cons_var].terms:
        raise HTTPException(status_code=400, detail=f"Invalid consequent {cons_var}:{cons_term}")

    builder.rules_data.append(data.dict())
    builder.system = None # Invalidate built system
    return {"message": "Rule added"}

@app.post("/build")
def build_system():
    """Builds the system using defined input/output roles."""
    
    # Identify output logic
    outputs = [n for n, r in builder.roles.items() if r == 'output']
    if not outputs:
        # Fallback if no output defined explicitly? Or error.
        # Let's try to auto-detect from rules? No, enforce role.
        raise HTTPException(status_code=400, detail="No output variable defined. Please create a variable with role='output'.")
    
    output_var_name = outputs[0] # Single output supported for now
    
    inputs = [v for k, v in builder.variables.items() if builder.roles.get(k) == 'input']
    output = builder.variables[output_var_name]
    
    rules = []
    for r_data in builder.rules_data:
        antecedents = []
        for v_name, t_name in r_data['antecedents'].items():
            antecedents.append((builder.variables[v_name], t_name))
        
        # Consequent
        c_name = list(r_data['consequent'].keys())[0]
        c_term = list(r_data['consequent'].values())[0]
        
        rules.append(FuzzyRule(antecedent=antecedents, consequent=(builder.variables[c_name], c_term)))
        
    builder.system = FuzzyModule(inputs=inputs, output=output, rules=rules, defuzz_method=Centroid(output.range_min, output.range_max))
    return {"message": "System built successfully"}

@app.post("/simulate")
def simulate(data: SimulateRequest):
    if not builder.system:
        raise HTTPException(status_code=400, detail="System not built yet")
        
    # Convert inputs to tensor dict
    inputs_torch = {k: torch.tensor([v]) for k, v in data.inputs.items()}
    
    try:
        # Get Activations
        activations = builder.system.get_rule_activations(inputs_torch)[0] # (num_rules,)
        
        # Get Output
        output = builder.system(inputs_torch)
        
        # Format explanation
        rules_triggered = []
        for i, act in enumerate(activations):
            if act > 0.001:
                rules_triggered.append({
                    "config": builder.rules_data[i],
                    "strength": act.item()
                })
                
        return {
            "output": output.item(),
            "rules_triggered": rules_triggered
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/plot/{var_name}")
def get_plot_data(var_name: str):
    var = builder.get_variable(var_name)
    x = torch.linspace(var.range_min, var.range_max, 200)
    data = {"x": x.tolist(), "terms": {}}
    
    for t_name, mf in var.terms.items():
        y = mf(x)
        data["terms"][t_name] = y.tolist()
        
    return data

# Mount UI
app.mount("/", StaticFiles(directory="ui", html=True), name="ui")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
