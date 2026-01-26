const { useState, useEffect, useMemo, useRef } = React;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine } = Recharts;

// --- Icons ---
const Icons = {
    Plus: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Trash: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Play: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Settings: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Download: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
    Upload: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
    X: () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    Power: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    Caret: () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
};

// --- Styled Components ---

const Button = ({ onClick, children, variant = "primary", size = "md", className = "", icon: Icon, disabled }) => {
    const base = "inline-flex items-center justify-center rounded-md font-semibold tracking-tight transition-all duration-200 focus:outline-none whitespace-nowrap active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100";

    const variants = {
        primary: "bg-zinc-100 text-zinc-900 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_4px_12px_rgba(0,0,0,0.1)] hover:bg-white hover:shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_16px_rgba(0,0,0,0.2)] hover:-translate-y-[1px]",
        secondary: "bg-zinc-900 text-zinc-300 border border-zinc-700/50 shadow-sm hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-600 hover:-translate-y-[0.5px]",
        ghost: "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors",
        danger: "bg-rose-950/20 text-rose-500 border border-rose-900/30 hover:bg-rose-900/30 hover:text-rose-400 hover:border-rose-800 hover:-translate-y-[0.5px]",
        action: "bg-violet-600 text-white shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_4px_12px_rgba(124,58,237,0.3)] hover:bg-violet-500 hover:shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_8px_16px_rgba(124,58,237,0.4)] hover:-translate-y-[1px]"
    };

    const sizes = {
        sm: "px-2.5 py-1.5 text-[11px]",
        md: "px-4 py-2 text-xs",
        lg: "px-6 py-3 text-sm",
        icon: "p-2 aspect-square"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {Icon && <span className={`${children ? 'mr-2' : ''} opacity-90`}><Icon /></span>}
            {children}
        </button>
    );
};

const Input = ({ label, className = "", ...props }) => (
    <div className={`w-full ${className}`}>
        {label && <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">{label}</label>}
        <input {...props} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 text-xs focus:border-zinc-600 focus:outline-none transition-colors placeholder-zinc-700" />
    </div>
);

const Select = ({ label, children, ...props }) => (
    <div className="w-full">
        {label && <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">{label}</label>}
        <div className="relative">
            <select {...props} className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 text-xs focus:border-zinc-600 focus:outline-none transition-colors cursor-pointer">
                {children}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-zinc-600"><Icons.Settings /></div>
        </div>
    </div>
);

// --- Config ---
const COLORS = ["#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#60a5fa"];

const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
};

// ----------------------------------------------------------------------
// Main Application
// ----------------------------------------------------------------------

function App() {
    const [config, setConfig] = useState({ variables: {}, rules: [] });
    const [view, setView] = useState("editor"); // editor | rules | simulate
    const [selectedVarName, setSelectedVarName] = useState(null);

    const refresh = async () => {
        try {
            const res = await fetch("/config");
            const data = await res.json();
            setConfig(data);
            // Ensure valid selection
            if (view === 'editor' && !selectedVarName && Object.keys(data.variables).length > 0) {
                setSelectedVarName(Object.keys(data.variables)[0]);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => { refresh(); }, [view]);

    // Import/Export
    const handleExport = async () => {
        const res = await fetch("/export"); downloadJSON(await res.json(), `fuzzy_system.json`);
    };
    const handleImport = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try { await fetch("/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: ev.target.result }); refresh(); } catch (e) { alert("Import failed"); }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-zinc-300 font-sans overflow-hidden">
            {/* Header / Toolbar */}
            <header className="h-10 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-zinc-100 text-sm tracking-tight">Fuzzy Studio</span>
                    <nav className="flex gap-1">
                        {["Editor", "Rules", "Simulate"].map(v => (
                            <button key={v} onClick={() => setView(v.toLowerCase())}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${view === v.toLowerCase() ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                                    }`}>
                                {v}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExport} className="text-zinc-500 hover:text-zinc-300" title="Export"><Icons.Download /></button>
                    <label className="text-zinc-500 hover:text-zinc-300 cursor-pointer" title="Import">
                        <Icons.Upload />
                        <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                    </label>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex min-h-0">
                {view === "editor" && <IDEView config={config} refresh={refresh} selectedVarName={selectedVarName} setSelectedVarName={setSelectedVarName} />}
                {view === "rules" && <RulesView config={config} refresh={refresh} />}
                {view === "simulate" && <SimulateView config={config} />}
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// View: IDE (Variables Sidebar + Editor Main)
// ----------------------------------------------------------------------
function IDEView({ config, refresh, selectedVarName, setSelectedVarName }) {
    const [creationState, setCreationState] = useState(null); // { role: 'input' | 'output' }
    const [createForm, setCreateForm] = useState({ name: "", min: 0, max: 10 });

    // Group variables
    const inputs = Object.keys(config.variables).filter(v => config.variables[v].role === 'input');
    const outputs = Object.keys(config.variables).filter(v => config.variables[v].role === 'output');

    const startCreation = (role) => {
        setCreationState({ role });
        setCreateForm({ name: "", min: 0, max: 10 });
    };

    const confirmCreation = async () => {
        if (!createForm.name) return;
        await fetch("/variable", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: createForm.name,
                min_val: parseFloat(createForm.min),
                max_val: parseFloat(createForm.max),
                role: creationState.role
            })
        });
        refresh();
        setSelectedVarName(createForm.name);
        setCreationState(null);
    };

    return (
        <>
            {/* Sidebar */}
            <aside className="w-60 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
                    {/* Inputs Group */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Inputs</span>
                            <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">{inputs.length}</span>
                        </div>
                        <div className="space-y-1 mb-2">
                            {inputs.map(v => (
                                <SidebarItem key={v} name={v} role="input" active={selectedVarName === v} onClick={() => setSelectedVarName(v)} />
                            ))}
                        </div>

                        {creationState?.role === 'input' ? (
                            <CreationForm form={createForm} setForm={setCreateForm} onConfirm={confirmCreation} onCancel={() => setCreationState(null)} />
                        ) : (
                            <button onClick={() => startCreation('input')} className="group w-full py-2 rounded-lg border border-zinc-800/50 bg-zinc-900/10 text-[11px] font-semibold text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40 hover:border-zinc-700 transition-all flex items-center justify-between px-3">
                                <span>Add Input</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Plus /></span>
                            </button>
                        )}
                    </div>

                    {/* Outputs Group */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Outputs</span>
                            <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">{outputs.length}</span>
                        </div>
                        <div className="space-y-1 mb-2">
                            {outputs.map(v => (
                                <SidebarItem key={v} name={v} role="output" active={selectedVarName === v} onClick={() => setSelectedVarName(v)} />
                            ))}
                        </div>

                        {creationState?.role === 'output' ? (
                            <CreationForm form={createForm} setForm={setCreateForm} onConfirm={confirmCreation} onCancel={() => setCreationState(null)} />
                        ) : (
                            <button onClick={() => startCreation('output')} className="group w-full py-2 rounded-lg border border-zinc-800/50 bg-zinc-900/10 text-[11px] font-semibold text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40 hover:border-zinc-700 transition-all flex items-center justify-between px-3">
                                <span>Add Output</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Plus /></span>
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 min-w-0 bg-zinc-900/30">
                {selectedVarName && config.variables[selectedVarName] ? (
                    <VariableEditor name={selectedVarName} data={config.variables[selectedVarName]} refresh={refresh} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                        <div className="text-4xl opacity-20 mb-2"><Icons.Settings /></div>
                        <p>Select or create a variable to edit</p>
                    </div>
                )}
            </main>
        </>
    );
}

const SidebarItem = ({ name, role, active, onClick }) => (
    <div
        onClick={onClick}
        className={`px-3 py-2 rounded cursor-pointer flex items-center gap-3 text-xs transition-colors border ${active ? "bg-zinc-900 text-zinc-100 border-zinc-700" : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/50"
            }`}
    >
        <div className={`w-2 h-2 rounded-sm ${role === 'input' ? 'bg-violet-500' : 'bg-emerald-500'}`}></div>
        <span className="truncate flex-1 font-medium">{name}</span>
    </div>
);

const CreationForm = ({ form, setForm, onConfirm, onCancel }) => (
    <div className="p-2 border border-zinc-700 bg-zinc-900 rounded space-y-2 animate-in fade-in zoom-in-95 duration-200">
        <Input autoFocus placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-zinc-950" />
        <div className="flex gap-2">
            <Input type="number" placeholder="Min" value={form.min} onChange={e => setForm({ ...form, min: e.target.value })} className="bg-zinc-950" />
            <Input type="number" placeholder="Max" value={form.max} onChange={e => setForm({ ...form, max: e.target.value })} className="bg-zinc-950" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
            <button onClick={onCancel} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
            <button onClick={onConfirm} className="text-xs bg-zinc-100 hover:bg-white text-zinc-900 px-2 py-1 rounded font-bold">Create</button>
        </div>
    </div>
);

// --- Variable Editor Component ---
function VariableEditor({ name, data, refresh }) {
    const [plotData, setPlotData] = useState([]);
    const [termForm, setTermForm] = useState({ name: "", type: "tri", params: "" });

    useEffect(() => {
        // Fetch Plot Data
        fetch(`/plot/${name}`).then(r => r.json()).then(d => {
            const fmt = d.x.map((x, i) => {
                const row = { x };
                Object.keys(d.terms).forEach(t => row[t] = d.terms[t][i]);
                return row;
            });
            setPlotData(fmt);
        });

        // Reset form suggestion
        const mid = (data.max + data.min) / 2;
        setTermForm(p => ({ ...p, params: `${data.min}, ${mid}, ${data.max}` }));
    }, [name, data]);

    const addTerm = async () => {
        const p = termForm.params.split(',').map(x => parseFloat(x));
        await fetch(`/variable/${name}/term`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: termForm.name || "Term", type: termForm.type, params: p })
        });
        refresh();
    };

    const deleteTerm = async (t) => {
        await fetch(`/variable/${name}/term/${t}`, { method: "DELETE" });
        refresh();
    };

    const deleteVar = async () => {
        if (confirm(`Delete variable '${name}'?`)) {
            await fetch(`/variable/${name}`, { method: "DELETE" });
            refresh();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-zinc-100">{name}</h2>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${data.role === 'input' ? 'bg-violet-950/30 text-violet-400 border-violet-900/50' : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'}`}>
                            {data.role}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            Range: {data.min} to {data.max}
                        </span>
                    </div>
                </div>
                <Button variant="danger" size="sm" icon={Icons.Trash} onClick={deleteVar}>Delete</Button>
            </div>

            {/* Split View: Chart Top, Details Bottom? Or Side by Side? Vertical split is common in IDEs. */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">
                {/* Chart Area */}
                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg relative min-h-0 flex flex-col">
                    <div className="absolute top-3 right-3 flex flex-wrap gap-2 pointer-events-none z-10 justify-end max-w-lg">
                        {Object.keys(data.terms).map((t, i) => (
                            <div key={t} className="pointer-events-auto flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 shadow-sm backdrop-blur-sm">
                                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
                                <span className="font-medium">{t}</span>
                                <button onClick={() => deleteTerm(t)} className="ml-1 hover:text-rose-500 text-zinc-500 transition-colors"><Icons.X /></button>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 min-h-0 p-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={plotData} margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="x" stroke="#52525b" tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(1)} />
                                <Tooltip contentStyle={{ background: '#18181b', borderColor: '#27272a', fontSize: '11px', borderRadius: '4px' }} />
                                {Object.keys(data.terms).map((t, i) => (
                                    <Area key={t} type="basis" dataKey={t} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} strokeWidth={2} activeDot={{ r: 4 }} />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Properties Panel (Add Term) */}
                <div className="h-auto shrink-0 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                        <div className="w-3 h-px bg-zinc-700"></div> Add Membership Function <div className="flex-1 h-px bg-zinc-700"></div>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-3"><Input label="Term Name" placeholder="e.g. Low" value={termForm.name} onChange={e => setTermForm({ ...termForm, name: e.target.value })} /></div>
                        <div className="md:col-span-2">
                            <Select label="Type" value={termForm.type} onChange={e => setTermForm({ ...termForm, type: e.target.value })}>
                                <option value="tri">Triangular</option>
                                <option value="trap">Trapezoidal</option>
                                <option value="gauss">Gaussian</option>
                            </Select>
                        </div>
                        <div className="md:col-span-5"><Input label="Params (comma separated)" value={termForm.params} onChange={e => setTermForm({ ...termForm, params: e.target.value })} /></div>
                        <div className="md:col-span-2"><Button className="w-full" onClick={addTerm} icon={Icons.Plus}>Add Term</Button></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// View: Rules
// ----------------------------------------------------------------------
function RulesView({ config, refresh }) {
    const [antecedents, setAntecedents] = useState([{ var: "", term: "" }]);
    const [consequent, setConsequent] = useState({ var: "", term: "" });

    const addRule = async () => {
        const payload = {};
        antecedents.forEach(a => { if (a.var && a.term) payload[a.var] = a.term; });
        if (!consequent.var || !consequent.term) return;
        await fetch("/rule", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ antecedents: payload, consequent: { [consequent.var]: consequent.term } })
        });
        refresh();
    };

    const deleteRule = async (i) => {
        await fetch(`/rule/${i}`, { method: "DELETE" }); refresh();
    };

    const inputs = Object.keys(config.variables).filter(v => config.variables[v].role === 'input');
    const outputs = Object.keys(config.variables).filter(v => config.variables[v].role === 'output');

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-6 gap-6">
            {/* Rule Builder Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">New Rule Logic</h3>

                <div className="flex flex-col gap-2">
                    {/* Antecedents List */}
                    {antecedents.map((ant, i) => (
                        <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-1">
                            <div className={`w-10 text-right text-xs font-bold ${i === 0 ? 'text-violet-500' : 'text-zinc-600'}`}>{i === 0 ? "IF" : "AND"}</div>

                            <div className="flex-1 max-w-xs">
                                <Select value={ant.var} onChange={e => { const c = [...antecedents]; c[i].var = e.target.value; c[i].term = ""; setAntecedents(c); }}>
                                    <option value="">Select Input...</option>
                                    {inputs.map(v => <option key={v} value={v}>{v}</option>)}
                                </Select>
                            </div>

                            <span className="text-zinc-600 text-xs italic">is</span>

                            <div className="flex-1 max-w-xs">
                                <Select value={ant.term} disabled={!ant.var} onChange={e => { const c = [...antecedents]; c[i].term = e.target.value; setAntecedents(c); }}>
                                    <option value="">Select Term...</option>
                                    {ant.var && Object.keys(config.variables[ant.var].terms).map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                            </div>

                            {i > 0 ? (
                                <button onClick={() => setAntecedents(antecedents.filter((_, x) => x !== i))} className="p-1 text-zinc-600 hover:text-rose-500 transition-colors"><Icons.Trash /></button>
                            ) : <div className="w-5"></div>}
                        </div>
                    ))}

                    {/* Add Condition Button */}
                    <div className="flex items-center gap-3">
                        <div className="w-10"></div>
                        <button onClick={() => setAntecedents([...antecedents, { var: "", term: "" }])} className="text-xs text-violet-500 hover:text-violet-400 font-medium flex items-center gap-1">
                            <Icons.Plus /> Add Condition
                        </button>
                    </div>
                </div>

                <div className="h-px bg-zinc-800 w-full my-1"></div>

                {/* Consequent */}
                <div className="flex items-center gap-3">
                    <div className="w-10 text-right text-xs font-bold text-emerald-500">THEN</div>
                    <div className="flex-1 max-w-xs">
                        <Select value={consequent.var} onChange={e => setConsequent(p => ({ ...p, var: e.target.value }))}>
                            <option value="">Select Output...</option>
                            {outputs.map(v => <option key={v} value={v}>{v}</option>)}
                        </Select>
                    </div>
                    <span className="text-zinc-600 text-xs italic">is</span>
                    <div className="flex-1 max-w-xs">
                        <Select value={consequent.term} disabled={!consequent.var} onChange={e => setConsequent(p => ({ ...p, term: e.target.value }))}>
                            <option value="">Select Term...</option>
                            {consequent.var && Object.keys(config.variables[consequent.var].terms).map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                    </div>
                    <div className="w-5"></div>
                </div>

                <div className="flex justify-end mt-2">
                    <Button onClick={addRule} variant="action" icon={Icons.Check}>Create Rule</Button>
                </div>
            </div>

            {/* Rule List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950/50 border border-zinc-800 rounded-lg">
                <table className="w-full text-left text-xs text-zinc-400">
                    <thead className="bg-zinc-900 text-zinc-500 font-bold uppercase tracking-wider sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Rule Logic</th>
                            <th className="px-4 py-3 w-16 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {config.rules.map((rule, i) => (
                            <tr key={i} className="hover:bg-zinc-900/40 group transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-y-1 items-center">
                                        <span className="font-bold text-violet-500/80 mr-2">IF</span>
                                        {Object.entries(rule.antecedents).map(([v, t], j) => (
                                            <span key={j} className="mr-3 flex items-center">
                                                {j > 0 && <span className="text-zinc-600 mr-3 text-[10px] uppercase">AND</span>}
                                                <span className="text-zinc-300 mr-1.5">{v}</span>
                                                <span className="text-zinc-500 mr-1.5">is</span>
                                                <span className="text-zinc-200 font-medium bg-zinc-800 px-1.5 rounded">{t}</span>
                                            </span>
                                        ))}
                                        <div className="w-px h-4 bg-zinc-700 mx-2"></div>
                                        <span className="font-bold text-emerald-500/80 mr-2">THEN</span>
                                        <span className="text-zinc-300 mr-1.5">{Object.keys(rule.consequent)[0]}</span>
                                        <span className="text-zinc-500 mr-1.5">is</span>
                                        <span className="text-emerald-400 font-medium bg-emerald-950/30 px-1.5 rounded border border-emerald-900/30">{Object.values(rule.consequent)[0]}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => deleteRule(i)} className="text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Icons.Trash /></button>
                                </td>
                            </tr>
                        ))}
                        {config.rules.length === 0 && <tr><td colSpan="2" className="px-4 py-8 text-center text-zinc-600 italic">No rules defined.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// View: Simulator
// ----------------------------------------------------------------------
function SimulateView({ config }) {
    const [inputs, setInputs] = useState({});
    const [result, setResult] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);

    const inputsList = Object.keys(config.variables).filter(v => config.variables[v].role === 'input');

    useEffect(() => {
        const i = {};
        inputsList.forEach(v => i[v] = config.variables[v].min);
        setInputs(i);
    }, [config]);

    const build = async () => {
        setStatus("building"); setError(null);
        try { const res = await fetch("/build", { method: "POST" }); if (!res.ok) throw await res.json(); setStatus("ready"); }
        catch (e) { setError(e.detail); setStatus("idle"); }
    };

    const run = async () => {
        if (status !== "ready") return;
        const res = await fetch("/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inputs }) });
        setResult(await res.json());
    };

    useEffect(() => { if (status === "ready") { const t = setTimeout(run, 150); return () => clearTimeout(t); } }, [inputs, status]);

    if (status === "idle") {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center p-12 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-500 border border-zinc-700/50">
                        <div className="scale-150"><Icons.Power /></div>
                    </div>
                    <h2 className="text-xl font-bold text-zinc-200 mb-2">Engine Offline</h2>
                    <p className="text-zinc-500 text-sm mb-8 max-w-xs mx-auto">Initialize the fuzzy logic engine to start the interactive simulation.</p>
                    <Button size="lg" variant="action" onClick={build} icon={Icons.Power}>Initialize Engine</Button>
                    {error && <div className="mt-4 text-rose-500 text-xs font-mono">{error}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Input Sidebar */}
            <div className="w-64 bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col gap-6 overflow-y-auto">
                <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-4 tracking-wider">Parameters</h3>
                    <div className="space-y-6">
                        {inputsList.map(v => (
                            <div key={v}>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-zinc-300 font-bold">{v}</span>
                                    <span className="font-mono text-violet-400">{inputs[v]?.toFixed(2)}</span>
                                </div>
                                <input type="range" className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                    min={config.variables[v].min} max={config.variables[v].max} step="0.1"
                                    value={inputs[v] || 0} onChange={e => setInputs({ ...inputs, [v]: parseFloat(e.target.value) })}
                                />
                                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                                    <span>{config.variables[v].min}</span><span>{config.variables[v].max}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-auto pt-4 border-t border-zinc-800">
                    <button onClick={() => setStatus('idle')} className="w-full py-2 text-xs text-zinc-600 hover:text-zinc-400 border border-transparent hover:border-zinc-800 rounded">Stop Engine</button>
                </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 bg-zinc-900/30 flex flex-col p-8">
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-cyan-600">
                        {result ? result.output.toFixed(2) : "--"}
                    </div>
                    <div className="text-lg text-emerald-500/80 font-medium mt-2">Calculated Output</div>
                </div>

                <div className="h-64 border-t border-zinc-800 pt-6">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-4">Inference Trace</h3>
                    <div className="h-full overflow-y-auto custom-scrollbar space-y-2">
                        {result?.rules_triggered.map((rule, i) => (
                            <div key={i} className="flex items-center gap-4 text-xs group">
                                <div className="w-12 text-right font-mono text-zinc-500">{(rule.strength * 100).toFixed(0)}%</div>
                                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-500" style={{ width: `${rule.strength * 100}%` }}></div>
                                </div>
                                <div className="w-1/3 truncate text-zinc-400">
                                    Term: <span className="text-emerald-400">{Object.values(rule.config.consequent)[0]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
