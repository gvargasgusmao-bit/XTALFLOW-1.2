import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FlaskConical, UploadCloud, Activity, 
  Beaker, Notebook, Plus, Trash2,
  Maximize2, X, ScrollText, Settings2, Eye,
  Columns, Droplet, Thermometer, Zap, Save, BrainCircuit, Info,
  ChevronDown, ChevronUp, PlusCircle, Edit3, FileDown, CheckCircle, AlertCircle,
  Wrench, Box, ScanLine 
} from 'lucide-react';

import { PDFDownloadLink } from '@react-pdf/renderer';
import RelatorioPDF from './components/RelatorioPDF';
import DeltaChart from './components/DeltaChart';

// --- COMPONENTE DE TOAST (NOTIFICAÇÃO) ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slideIn border ${type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' : type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : 'bg-yellow-900/90 border-yellow-500 text-yellow-100'}`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
      <span className="text-sm font-bold">{message}</span>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('screening'); 
  
  // --- ESTADOS PERSISTENTES ---
  const [farmaco, setFarmaco] = useState(() => {
    const saved = localStorage.getItem('cristalo_farmaco');
    return saved ? JSON.parse(saved) : { nome: '', pka: '', mw: '', logp: '', donors: 0, acceptors: 0 };
  });
  
  const [experimentos, setExperimentos] = useState(() => {
    const saved = localStorage.getItem('cristalo_experimentos');
    return saved ? JSON.parse(saved) : [];
  });

  const [notas, setNotas] = useState(() => {
    const saved = localStorage.getItem('cristalo_notas');
    return saved ? JSON.parse(saved) : [];
  });

  // Estados voláteis
  const [massa, setMassa] = useState(30);
  const [ratio, setRatio] = useState(1.0); 
  const [metodo, setMetodo] = useState('protonacao'); 
  const [concNaOH, setConcNaOH] = useState(16); 
  const [protocoloModal, setProtocoloModal] = useState(null); 
  const [currentProtocolData, setCurrentProtocolData] = useState(null); 
  const [imgPreview, setImgPreview] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [sugestaoIA, setSugestaoIA] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [compareModal, setCompareModal] = useState(null);
  const [novaNota, setNovaNota] = useState("");
  const [expandedExpId, setExpandedExpId] = useState(null); 
  const [novoSolventeInput, setNovoSolventeInput] = useState(""); 
  const [solventes, setSolventes] = useState([]);
  const [buscaSolvente, setBuscaSolvente] = useState("");
  const [solventeSelecionado, setSolventeSelecionado] = useState(null);
  const [toast, setToast] = useState(null); 
  
  // --- ESTADOS: TOOLBOX ---
  const [toolKp, setToolKp] = useState({ mw: '', densidade: '', resultado: null });
  const [toolHBond, setToolHBond] = useState({ dist: '', ang: '', resultado: null });

  // --- EFEITOS DE PERSISTÊNCIA ---
  useEffect(() => { localStorage.setItem('cristalo_farmaco', JSON.stringify(farmaco)); }, [farmaco]);
  useEffect(() => { localStorage.setItem('cristalo_experimentos', JSON.stringify(experimentos)); }, [experimentos]);
  useEffect(() => { localStorage.setItem('cristalo_notas', JSON.stringify(notas)); }, [notas]);

  useEffect(() => {
    if (activeTab === 'solvents' && solventes.length === 0) {
        axios.get('http://localhost:8000/solventes')
             .then(res => setSolventes(res.data))
             .catch(err => showToast("Erro ao carregar solventes.", "error"));
    }
  }, [activeTab]);

  // --- HELPERS ---
  const showToast = (msg, type = 'success') => setToast({ message: msg, type });
  
  // --- FUNÇÕES TOOLS ---
  const calcularKp = async () => {
      if(!toolKp.mw || !toolKp.densidade) { showToast("Preencha MW e Densidade", "error"); return; }
      try {
          const res = await axios.post('http://localhost:8000/ferramentas/kitajgorodskij', { 
              mw: parseFloat(toolKp.mw), 
              densidade: parseFloat(toolKp.densidade) 
          });
          setToolKp({...toolKp, resultado: res.data});
          showToast("Coeficiente calculado!");
      } catch(e) { showToast("Erro no cálculo Kp", "error"); }
  };

  const calcularHBond = async () => {
    if(!toolHBond.dist || !toolHBond.ang) { showToast("Preencha Distância e Ângulo", "error"); return; }
    try {
        const res = await axios.post('http://localhost:8000/ferramentas/hbond', {
            distancia: parseFloat(toolHBond.dist),
            angulo: parseFloat(toolHBond.ang)
        });
        setToolHBond({...toolHBond, resultado: res.data});
        showToast("Geometria analisada!");
    } catch(e) { showToast("Erro na análise", "error"); }
  };

  const handleComparar = (res) => {
    if (!imgPreview) { showToast("Faça upload da imagem do Fármaco primeiro!", "error"); return; }
    if (!res.imagem_url) { showToast("Ácido sem mapa disponível.", "error"); return; }
    setCompareModal({ apiImg: imgPreview, acidImg: res.imagem_url, acidName: res.nome_acido });
  };

  const handleSalvarSolvente = (e, solv) => {
    e.stopPropagation();
    const texto = `SELEÇÃO DE SOLVENTE:\n- Nome: ${solv.nome}\n- Família: ${solv.family}\n- Ponto de Ebulição: ${solv.bp}°C\n- Segurança: ${solv.safety}`;
    setNotas([{ id: Date.now(), texto: texto, data: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }, ...notas]);
    showToast(`Solvente ${solv.nome} registrado nas notas.`);
  };

  const gerarProtocolo = (res) => {
    const dataHoje = new Date().toLocaleDateString();
    
    const solv = solventeSelecionado || (sugestaoIA ? sugestaoIA.sugestao : null);
    const motivo = (sugestaoIA && sugestaoIA.sugestao.nome === solv?.nome) 
        ? `Recomendação baseada em LogP para fármacos ${sugestaoIA.categoria_farmaco}` 
        : "Seleção manual";

    let texto = `PROTOCOLO EXPERIMENTAL - ${dataHoje}\n`;
    texto += `Sistema: ${farmaco.nome || 'API'} + ${res.nome_acido}\n`;
    texto += `Estequiometria: ${ratio === 1 ? '1:1' : ratio === 0.5 ? '2:1' : '1:2'}\n`;
    if (solv) {
        texto += `>> SOLVENTE INICIAL: ${solv.nome} (${solv.bp}°C)\n`;
        texto += `   (${motivo})\n`;
    }
    texto += `------------------------------------------------\n`;
    
    if (metodo === 'protonacao') {
      texto += `TÉCNICA: PROTONAÇÃO DIRETA\n\n`;
      texto += `1. PESAGEM:\n`;
      texto += `   [ ] Pesar ${parseFloat(massa).toFixed(1)} mg de ${farmaco.nome}\n`;
      texto += `   [ ] Pesar ${res.massa_pesar} mg de ${res.nome_acido}\n`;
      texto += `\n2. PROCEDIMENTO:\n`;
      texto += `   - Misturar sólidos.\n   - Adicionar solvente gota a gota até dissolução total.\n   - Evaporar lentamente.`;
    } else {
      texto += `TÉCNICA: NEUTRALIZAÇÃO (IONIZAÇÃO)\n\n`;
      texto += `1. PREPARO:\n   - NaOH Conc: ${concNaOH} mg/mL\n`;
      texto += `2. REAGENTES:\n`;
      texto += `   - Ácido: ${res.nome_acido} (${res.massa_pesar} mg)\n`;
      texto += `   - Base: Solução NaOH (${res.vol_naoh} µL)\n`;
      texto += `   - API: ${farmaco.nome} (${parseFloat(massa).toFixed(1)} mg)\n`;
    }

    setCurrentProtocolData({
        api: farmaco.nome || 'API',
        acido: res.nome_acido,
        data: dataHoje,
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        protocoloTexto: texto,
        solventeInicial: solv ? { nome: solv.nome, tipo: 'IA/Manual', obs: motivo } : null,
        metodo: metodo
    });

    setProtocoloModal(texto);
  };

  const salvarNoCaderno = () => {
    if (protocoloModal && currentProtocolData) {
      const novoExperimento = {
          id: Date.now(),
          titulo: `${currentProtocolData.api} + ${currentProtocolData.acido}`,
          data: currentProtocolData.data,
          hora: currentProtocolData.hora,
          protocoloOriginal: currentProtocolData.protocoloTexto,
          solventesTestados: currentProtocolData.solventeInicial ? [currentProtocolData.solventeInicial] : [],
          observacoes: "" 
      };

      setExperimentos([novoExperimento, ...experimentos]);
      setProtocoloModal(null);
      setCurrentProtocolData(null);
      setActiveTab('notebook');
      showToast("Experimento salvo no caderno!");
    }
  };

  const toggleExpandirExperimento = (id) => {
    setExpandedExpId(expandedExpId === id ? null : id);
    setNovoSolventeInput(""); 
  };

  const adicionarSolventeExtra = (expId) => {
    if (!novoSolventeInput.trim()) return;
    
    setExperimentos(experimentos.map(exp => {
        if (exp.id === expId) {
            return {
                ...exp,
                solventesTestados: [...exp.solventesTestados, { nome: novoSolventeInput, tipo: 'Extra', obs: 'Adicionado manualmente' }]
            };
        }
        return exp;
    }));
    setNovoSolventeInput("");
    showToast("Solvente adicional registrado");
  };

  const atualizarObservacoes = (expId, novoTexto) => {
    setExperimentos(experimentos.map(exp => {
        if (exp.id === expId) {
            return { ...exp, observacoes: novoTexto };
        }
        return exp;
    }));
  };

  const removerExperimento = (id, e) => {
    e.stopPropagation();
    if(confirm("Tem certeza que deseja apagar este experimento do caderno?")) {
        setExperimentos(experimentos.filter(e => e.id !== id));
        showToast("Experimento removido", "error");
    }
  };
  
  const limparCaderno = () => {
      if(confirm("ATENÇÃO: Isso apagará TODOS os experimentos e notas salvos. Continuar?")) {
          setExperimentos([]);
          setNotas([]);
          localStorage.removeItem('cristalo_experimentos');
          localStorage.removeItem('cristalo_notas');
          showToast("Caderno resetado.", "error");
      }
  }

  const handleCalcular = async () => {
    if (!farmaco.pka || !farmaco.mw) { showToast("Preencha pKa e MW.", "error"); return; }
    setLoading(true);
    setSugestaoIA(null); 
    try {
      const response = await axios.post('http://localhost:8000/calcular', {
        pka_farmaco: parseFloat(farmaco.pka),
        mw_farmaco: parseFloat(farmaco.mw),
        massa_base: parseFloat(massa),
        nome_farmaco: farmaco.nome || "API",
        molar_ratio: parseFloat(ratio),
        conc_naoh_mg_ml: parseFloat(concNaOH),
        logp: farmaco.logp ? parseFloat(farmaco.logp) : 0.0,
        donors_api: farmaco.donors ? parseInt(farmaco.donors) : 0,
        acceptors_api: farmaco.acceptors ? parseInt(farmaco.acceptors) : 0
      });
      setResultados(response.data.lista_acidos);
      setSugestaoIA(response.data.sugestao_solvente);
      showToast("Cálculo finalizado!");
    } catch (err) { showToast("Erro no servidor.", "error"); } 
    finally { setLoading(false); }
  };

  const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) setImgPreview(URL.createObjectURL(file)); };
  
  const adicionarNota = () => { 
      if(novaNota.trim()) { 
          setNotas([{ id: Date.now(), texto: novaNota, data: new Date().toLocaleTimeString() }, ...notas]); 
          setNovaNota(""); 
          showToast("Nota adicionada");
      }
  };
  
  const removerNota = (id) => {
      setNotas(notas.filter(n => n.id !== id));
      showToast("Nota removida", "error");
  };

  const solventesFiltrados = solventes.filter(s => 
    s.nome.toLowerCase().includes(buscaSolvente.toLowerCase()) || 
    s.family.toLowerCase().includes(buscaSolvente.toLowerCase())
  );

  return (
    <div className="relative h-screen bg-ufms-carbon text-ufms-text font-sans selection:bg-ufms-gold selection:text-black flex overflow-hidden">
      
      {/* TOAST CONTAINER */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* SIDEBAR */}
      <aside className="h-full w-80 bg-ufms-surface border-r border-gray-800 p-6 flex flex-col z-20 overflow-y-auto custom-scrollbar shadow-xl shrink-0">
        <div className="flex flex-col items-center mb-6 shrink-0">
          <div className="relative group cursor-pointer">
             <div className="absolute -inset-1 bg-linear-to-r from-ufms-gold to-yellow-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
             <img src="/logo.png" alt="Logo" className="relative w-28 h-28 rounded-full border-4 border-ufms-gold bg-white p-1 shadow-2xl object-contain"/>
          </div>
          
          {/* --- NOME XTALFLOW NA SIDEBAR --- */}
          <h2 className="mt-4 text-2xl font-black tracking-tighter text-white uppercase text-center">
            XTAL<span className="text-ufms-gold">FLOW</span>
          </h2>
          <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-700 mt-1">v1.0 Alpha</span>
          <p className="mt-2 text-[10px] tracking-[0.2em] text-ufms-muted uppercase text-center opacity-60">Laboratório de Cristalografia</p>
        </div>

        <div className="flex flex-col gap-2 mb-6 bg-ufms-carbon p-2 rounded-xl border border-gray-700 shrink-0">
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('screening')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'screening' ? 'bg-ufms-gold text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <FlaskConical className="w-3 h-3"/> Screening
                </button>
                <button onClick={() => setActiveTab('solvents')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'solvents' ? 'bg-ufms-gold text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <Droplet className="w-3 h-3"/> Solventes
                </button>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('tools')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'tools' ? 'bg-ufms-gold text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <Wrench className="w-3 h-3"/> Tools
                </button>
                <button onClick={() => setActiveTab('notebook')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'notebook' ? 'bg-gray-200 text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <Notebook className="w-3 h-3"/> Caderno
                </button>
            </div>
        </div>

        {activeTab === 'screening' && (
          <div className="space-y-6 animate-fadeIn pb-4">
            <div>
              <label className="text-xs uppercase text-ufms-gold font-bold tracking-wider mb-2 block">1. Propriedades (API)</label>
              <div className="space-y-3">
                <input type="text" value={farmaco.nome} placeholder="Nome (Ex: Gatifloxacina)" className="w-full bg-ufms-carbon border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-ufms-gold outline-none" onChange={e => setFarmaco({...farmaco, nome: e.target.value})}/>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative"><span className="absolute left-3 top-3 text-gray-500 text-xs">pKa</span><input type="number" step="0.1" value={farmaco.pka} className="w-full bg-ufms-carbon border border-gray-700 rounded-lg pl-8 py-3 text-sm focus:border-ufms-gold outline-none" onChange={e => setFarmaco({...farmaco, pka: e.target.value})} /></div>
                  <div className="relative"><span className="absolute left-3 top-3 text-gray-500 text-xs">MW</span><input type="number" step="0.1" value={farmaco.mw} className="w-full bg-ufms-carbon border border-gray-700 rounded-lg pl-8 py-3 text-sm focus:border-ufms-gold outline-none" onChange={e => setFarmaco({...farmaco, mw: e.target.value})} /></div>
                </div>
                
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-2 text-center">H-Bond Propensity (Regra dos 12)</span>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-[10px] text-blue-400 block mb-1">Doadores</span>
                            <input type="number" value={farmaco.donors} onChange={e => setFarmaco({...farmaco, donors: e.target.value})} className="w-full bg-ufms-carbon border border-gray-600 rounded px-2 py-1 text-sm text-center focus:border-blue-400 outline-none text-white"/>
                        </div>
                        <div>
                            <span className="text-[10px] text-red-400 block mb-1">Aceitadores</span>
                            <input type="number" value={farmaco.acceptors} onChange={e => setFarmaco({...farmaco, acceptors: e.target.value})} className="w-full bg-ufms-carbon border border-gray-600 rounded px-2 py-1 text-sm text-center focus:border-red-400 outline-none text-white"/>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500 text-xs font-bold">LogP</span>
                    <input type="number" step="0.1" value={farmaco.logp} placeholder="Ex: 2.5" className="w-full bg-ufms-carbon border border-gray-700 rounded-lg pl-12 py-3 text-sm focus:border-ufms-gold outline-none" onChange={e => setFarmaco({...farmaco, logp: e.target.value})} />
                    <span className="absolute right-3 top-3 text-gray-600 text-[10px] cursor-help" title="Coeficiente de Partição: Define a lipofilicidade.">?</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-xs uppercase text-ufms-gold font-bold tracking-wider mb-2 block">2. Mapa Eletrostático</label>
              <div className="relative group">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                <div className="bg-ufms-carbon border border-dashed border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center group-hover:border-ufms-gold transition-colors">
                  <UploadCloud className="w-6 h-6 text-gray-400 mb-2 group-hover:text-ufms-gold" />
                  <span className="text-xs text-gray-500 text-center">{imgPreview ? "Imagem Carregada" : "Upload do Mapa"}</span>
                </div>
              </div>
            </div>

            <div className="bg-ufms-surface p-4 rounded-xl border border-gray-700 shadow-inner">
               <label className="text-xs uppercase text-ufms-gold font-bold tracking-wider mb-3 flex items-center gap-2"><Settings2 className="w-3 h-3"/> 3. Condições Exp.</label>
               <div className="mb-4">
                 <span className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Estequiometria</span>
                 <div className="flex bg-ufms-carbon rounded-lg p-1 border border-gray-600">
                    {[{label:'2:1',v:0.5}, {label:'1:1',v:1.0}, {label:'1:2',v:2.0}].map(o => (
                      <button key={o.label} onClick={() => setRatio(o.v)} className={`flex-1 text-xs py-1.5 rounded font-bold transition-all ${ratio === o.v ? 'bg-gray-600 text-white' : 'text-gray-500'}`}>{o.label}</button>
                    ))}
                 </div>
               </div>
               <div className="mb-4">
                 <span className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Método</span>
                 <select value={metodo} onChange={e => setMetodo(e.target.value)} className="w-full bg-ufms-carbon text-xs text-gray-200 border border-gray-600 rounded-lg p-2 outline-none focus:border-ufms-gold">
                   <option value="protonacao">Protonação Direta</option>
                   <option value="ionizacao">Neutralização (NaOH)</option>
                 </select>
               </div>
               {metodo === 'ionizacao' && (
                 <div className="mb-4 p-2 bg-blue-900/10 rounded border border-blue-500/20">
                    <span className="text-[10px] text-blue-400 uppercase block mb-1">Conc. NaOH (mg/mL)</span>
                    <input type="number" value={concNaOH} onChange={e => setConcNaOH(e.target.value)} className="w-full bg-ufms-carbon border border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-400 outline-none font-mono"/>
                 </div>
               )}
               <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Massa API</span><span className="text-ufms-gold font-mono">{massa} mg</span></div>
                  <input type="range" min="5" max="500" step="5" value={massa} onChange={e => setMassa(e.target.value)} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-ufms-gold"/>
               </div>
            </div>
            <button onClick={handleCalcular} disabled={loading} className="w-full bg-ufms-gold hover:bg-yellow-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg">
              {loading ? <Activity className="animate-spin w-4 h-4"/> : <FlaskConical className="w-4 h-4" />} Calcular
            </button>
          </div>
        )}

        {/* --- NOVA SIDEBAR PARA FERRAMENTAS --- */}
        {activeTab === 'tools' && (
            <div className="animate-fadeIn space-y-6">
                <div className="bg-ufms-surface p-4 rounded-xl border border-gray-700">
                    <h3 className="text-ufms-gold font-bold text-sm mb-2 flex items-center gap-2"><Wrench className="w-4 h-4"/> Toolbox Avançado</h3>
                    <p className="text-xs text-gray-400">Ferramentas de pós-processamento e verificação estrutural.</p>
                </div>
                
                {/* 1. CALCULADORA KITAJGORODSKIJ */}
                <div className="bg-ufms-carbon p-4 rounded-xl border border-gray-700 shadow-lg">
                    <label className="text-[10px] uppercase text-blue-400 font-bold block mb-3 flex items-center gap-1"><Box className="w-3 h-3"/> Empacotamento (Kp)</label>
                    <p className="text-[10px] text-gray-400 mb-3">Estima se o cristal tem espaço vazio para solvatos (Regra de Kitajgorodskij).</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                            <span className="text-[10px] text-gray-500">MW (g/mol)</span>
                            <input type="number" placeholder="MW" value={toolKp.mw} onChange={e=>setToolKp({...toolKp, mw: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-blue-400"/>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500">Densidade</span>
                            <input type="number" placeholder="g/cm³" value={toolKp.densidade} onChange={e=>setToolKp({...toolKp, densidade: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-blue-400"/>
                        </div>
                    </div>
                    <button onClick={calcularKp} className="w-full bg-blue-900/50 text-blue-200 border border-blue-500/50 rounded py-2 text-xs font-bold hover:bg-blue-800 transition-colors">Verificar Estabilidade</button>
                    
                    {toolKp.resultado && (
                        <div className={`mt-3 p-3 rounded text-xs border bg-opacity-10 animate-fadeIn ${toolKp.resultado.cor === 'red' ? 'bg-red-500 border-red-500 text-red-300' : toolKp.resultado.cor === 'green' ? 'bg-green-500 border-green-500 text-green-300' : 'bg-yellow-500 border-yellow-500 text-yellow-300'}`}>
                            <strong className="block text-sm mb-1">Kp: {toolKp.resultado.kp}%</strong>
                            <span className="font-bold block mb-1">{toolKp.resultado.status}</span>
                            <span className="opacity-80 leading-tight block">{toolKp.resultado.desc}</span>
                        </div>
                    )}
                </div>

                {/* 2. VALIDACAO GEOMÉTRICA (H-BOND) - NOVO CARD */}
                <div className="bg-ufms-carbon p-4 rounded-xl border border-gray-700 shadow-lg">
                    <label className="text-[10px] uppercase text-green-400 font-bold block mb-3 flex items-center gap-1"><ScanLine className="w-3 h-3"/> Geometria H-Bond</label>
                    <p className="text-[10px] text-gray-400 mb-3">Validação geométrica segundo Jeffrey & Steiner.</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                            <span className="text-[10px] text-gray-500">Dist. D...A (Å)</span>
                            <input type="number" step="0.01" placeholder="2.8" value={toolHBond.dist} onChange={e=>setToolHBond({...toolHBond, dist: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-green-400"/>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500">Ângulo (°)</span>
                            <input type="number" step="0.1" placeholder="160" value={toolHBond.ang} onChange={e=>setToolHBond({...toolHBond, ang: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-green-400"/>
                        </div>
                    </div>
                    <button onClick={calcularHBond} className="w-full bg-green-900/50 text-green-200 border border-green-500/50 rounded py-2 text-xs font-bold hover:bg-green-800 transition-colors">Classificar Ligação</button>

                    {toolHBond.resultado && (
                        <div className={`mt-3 p-3 rounded text-xs border bg-opacity-10 animate-fadeIn ${toolHBond.resultado.cor === 'red' ? 'bg-red-500 border-red-500 text-red-300' : toolHBond.resultado.cor === 'green' ? 'bg-green-500 border-green-500 text-green-300' : toolHBond.resultado.cor === 'purple' ? 'bg-purple-500 border-purple-500 text-purple-300' : 'bg-gray-500 border-gray-500 text-gray-300'}`}>
                            <strong className="block text-sm mb-1">{toolHBond.resultado.tipo}</strong>
                            <span className="block mb-1 text-[10px] uppercase font-bold tracking-wide">Energia: {toolHBond.resultado.energia}</span>
                            <span className="opacity-80 leading-tight block">{toolHBond.resultado.desc}</span>
                        </div>
                    )}
                </div>

            </div>
        )}

        {/* SIDEBAR PARA SOLVENTES */}
        {activeTab === 'solvents' && (
            <div className="animate-fadeIn space-y-4">
                <div className="bg-ufms-surface p-4 rounded-xl border border-gray-700">
                    <h3 className="text-ufms-gold font-bold text-sm mb-2 flex items-center gap-2"><Droplet className="w-4 h-4"/> Seleção de Solventes</h3>
                    <p className="text-xs text-gray-400 mb-2">Selecione um solvente da grade para definir no protocolo ou clique em "Registrar" para salvar nas notas gerais.</p>
                </div>
                {sugestaoIA && (
                    <div className="bg-linear-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/50 p-4 rounded-xl shadow-lg animate-fadeIn relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-20"><BrainCircuit className="w-12 h-12 text-white"/></div>
                        <span className="text-[10px] uppercase text-purple-300 font-bold block mb-1 flex items-center gap-1"><BrainCircuit className="w-3 h-3"/> IA Suggest</span>
                        <div className="text-white font-bold text-lg mb-1">{sugestaoIA.sugestao.nome}</div>
                        <div className="text-xs text-gray-300 italic mb-2">"{sugestaoIA.motivo}"</div>
                        <button onClick={() => setSolventeSelecionado(sugestaoIA.sugestao)} className="bg-purple-500 hover:bg-purple-400 text-white text-[10px] font-bold py-1 px-3 rounded uppercase tracking-wider transition-colors">Usar este</button>
                    </div>
                )}
                
                {solventeSelecionado && (
                    <div className="bg-ufms-carbon border border-ufms-gold/50 p-4 rounded-xl shadow-lg animate-fadeIn mt-4">
                        <span className="text-[10px] uppercase text-ufms-gold font-bold block mb-1">Selecionado Manualmente</span>
                        <div className="text-white font-bold text-lg mb-1">{solventeSelecionado.nome}</div>
                        <div className="text-xs text-gray-400">Ebulição: {solventeSelecionado.bp}°C</div>
                        <button onClick={() => setSolventeSelecionado(null)} className="mt-2 text-[10px] text-red-400 hover:text-red-300 underline">Remover seleção</button>
                    </div>
                )}
            </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-ufms-carbon relative z-10">
        
        <div className="shrink-0 p-8 pb-4 bg-ufms-carbon border-b border-gray-800 shadow-xl z-20">
            <header className="flex justify-between items-start">
              <div>
                {/* --- HEADER XTALFLOW --- */}
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <span className="text-ufms-gold text-4xl">◆</span> 
                    XtalFlow <span className="text-gray-600 font-light">Workspace</span>
                </h1>
                <p className="text-gray-400 text-xs mt-1 uppercase tracking-wide">
                    {activeTab === 'solvents' ? 'Biblioteca de Solventes' : activeTab === 'notebook' ? 'Caderno de Laboratório Digital' : activeTab === 'tools' ? 'Engenharia de Cristais (Tools)' : 'Screening de Co-Cristais'}
                </p>
              </div>
              
              {activeTab === 'screening' && sugestaoIA && (
                  <div className="hidden lg:flex items-center gap-4 bg-ufms-surface border border-purple-500/30 px-4 py-2 rounded-lg shadow-lg animate-fadeIn">
                      <div className="bg-purple-500/20 p-2 rounded-full"><BrainCircuit className="w-5 h-5 text-purple-400"/></div>
                      <div>
                          <span className="text-[10px] uppercase text-purple-400 font-bold block">Sugestão de Solvente</span>
                          <span className="text-sm font-bold text-white">{sugestaoIA.sugestao.nome}</span>
                      </div>
                      <div className="h-8 w-px bg-gray-700 mx-2"></div>
                      <div className="text-right">
                          <span className="text-[10px] text-gray-400 block">Classificação</span>
                          <span className="text-xs text-gray-200">{sugestaoIA.categoria_farmaco}</span>
                      </div>
                  </div>
              )}
            </header>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar scroll-smooth">
            
            {activeTab === 'screening' && (
              <div className="animate-fadeIn pb-20">
                {resultados.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl mt-4">
                        <FlaskConical className="w-10 h-10 mb-3 opacity-50"/>
                        <p className="text-sm">Configure o experimento na barra lateral.</p>
                    </div>
                )}

                {resultados.length > 0 && (<DeltaChart data={resultados} />)}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {resultados.map((res, i) => (
                    <div key={i} className={`group bg-ufms-surface rounded-xl p-4 border transition-all flex gap-4 items-start border-gray-800 hover:border-ufms-gold`}>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center"><h3 className="font-bold text-white text-lg">{res.nome_acido}</h3><span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${res.cor === 'success' ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>{res.classificacao}</span></div>
                        <div className="grid grid-cols-2 gap-2">
                           <div className="bg-ufms-carbon px-3 py-1 rounded border border-ufms-gold/30"><span className="text-[10px] text-ufms-gold block">Massa Ácido</span><span className="font-mono text-ufms-gold font-bold">{res.massa_pesar} mg</span></div>
                           
                           {res.hbond_score > -1 && (
                               <div className={`bg-ufms-carbon px-3 py-1 rounded border ${res.hbond_score === 0 ? 'border-green-500/50' : 'border-gray-600'}`}>
                                   <span className="text-[10px] text-gray-400 block">H-Bond Score</span>
                                   <span className={`font-mono font-bold ${res.hbond_score === 0 ? 'text-green-400' : 'text-gray-300'}`}>
                                       {res.hbond_score} {res.hbond_score === 0 ? '★' : ''}
                                   </span>
                               </div>
                           )}

                           {metodo === 'ionizacao' && (<div className={`px-3 py-1 rounded border ${res.alerta_pipeta ? 'bg-red-900/30 border-red-500' : 'bg-blue-900/20 border-blue-500/30'}`}><span className={`text-[10px] block ${res.alerta_pipeta ? 'text-red-400' : 'text-blue-400'}`}>Volume NaOH</span><span className="font-mono font-bold text-white">{res.vol_naoh} µL</span></div>)}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => gerarProtocolo(res)} className="mt-2 text-xs flex-1 px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center gap-2"><ScrollText className="w-3 h-3 text-ufms-gold" /> Protocolo</button>
                            {res.imagem_url && (<button onClick={() => handleComparar(res)} className="mt-2 text-xs px-3 py-1.5 rounded bg-ufms-carbon border border-gray-600 hover:border-ufms-gold text-gray-300 flex items-center gap-2"><Columns className="w-3 h-3" /> Comparar</button>)}
                        </div>
                      </div>
                      <div className="w-24 h-24 bg-white rounded-lg p-1 flex items-center justify-center border border-gray-600 relative group/img cursor-zoom-in" onClick={() => res.imagem_url && setZoomedImage(res.imagem_url)}>
                        {res.imagem_url ? <img src={res.imagem_url} alt="" className="w-full h-full object-contain" /> : <Beaker className="text-gray-300"/>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- ABA TOOLS (MAIN CONTENT PLACEHOLDER) --- */}
            {activeTab === 'tools' && (
                <div className="animate-fadeIn flex flex-col items-center justify-center h-full text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl p-8 opacity-50">
                    <Wrench className="w-16 h-16 mb-4"/>
                    <h3 className="text-xl font-bold mb-2">Área de Ferramentas</h3>
                    <p>Use a barra lateral para inserir dados e realizar os cálculos.</p>
                </div>
            )}

            {activeTab === 'solvents' && (
                <div className="animate-fadeIn pb-20">
                    <div className="flex gap-4 mb-6">
                        <input type="text" placeholder="Buscar solvente (Ex: Etanol, Cetona...)" value={buscaSolvente} onChange={e => setBuscaSolvente(e.target.value)} className="flex-1 bg-ufms-surface border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-ufms-gold outline-none"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {solventesFiltrados.map((solv, idx) => (
                            <div key={idx} onClick={() => setSolventeSelecionado(solv)} className={`relative p-5 rounded-xl border cursor-pointer transition-all group overflow-hidden ${solventeSelecionado?.nome === solv.nome ? 'bg-ufms-surface border-ufms-gold shadow-[0_0_15px_rgba(201,162,39,0.2)]' : 'bg-ufms-surface border-gray-800 hover:border-gray-600 hover:bg-gray-800'}`}>
                                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${solv.color === 'red' ? 'bg-red-500' : solv.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'}`} title={`Segurança: ${solv.safety}`}></div>
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg text-white group-hover:text-ufms-gold transition-colors">{solv.nome}</h3>
                                </div>
                                <span className="inline-block px-2 py-0.5 rounded bg-ufms-carbon text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-4 border border-gray-700">{solv.family}</span>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between text-xs"><span className="text-gray-500 flex items-center gap-1"><Thermometer className="w-3 h-3"/> Ebulição</span><span className="font-mono text-ufms-gold">{solv.bp}°C</span></div>
                                    <div className="flex items-center justify-between text-xs"><span className="text-gray-500 flex items-center gap-1"><Zap className="w-3 h-3"/> Dielétrica</span><span className="font-mono text-ufms-gold">{solv.dielectric}</span></div>
                                </div>
                                <div className={`text-[10px] text-center py-1 rounded border uppercase font-bold mb-3 ${solv.color === 'red' ? 'bg-red-900/20 text-red-400 border-red-900' : solv.color === 'green' ? 'bg-green-900/20 text-green-400 border-green-900' : 'bg-yellow-900/20 text-yellow-400 border-yellow-900'}`}>{solv.safety}</div>
                                <div className={`transition-opacity duration-300 ${solventeSelecionado?.nome === solv.nome ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <button onClick={(e) => handleSalvarSolvente(e, solv)} className="w-full bg-ufms-carbon border border-gray-600 hover:border-ufms-gold text-white hover:text-ufms-gold text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                                        <Save className="w-3 h-3" /> Registrar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- CADERNO DE LABORATÓRIO MELHORADO --- */}
            {activeTab === 'notebook' && (
              <div className="max-w-4xl mx-auto animate-fadeIn pb-20">
                
                {/* Header com Botão de Exportar */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Caderno de Laboratório</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <p className="text-gray-400 text-xs">Salvo Localmente (Auto-Save)</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={limparCaderno} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 font-bold py-2 px-4 rounded-xl flex items-center gap-2 border border-red-900/50 transition-all text-xs">
                            <Trash2 className="w-4 h-4"/> Resetar
                        </button>
                        <PDFDownloadLink
                            document={<RelatorioPDF farmaco={farmaco} resultados={resultados} experimentos={experimentos} />}
                            fileName={`Relatorio_${farmaco.nome || 'API'}_${new Date().toISOString().slice(0,10)}.pdf`}
                            className="bg-ufms-gold hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg transition-all text-xs"
                        >
                            {({ blob, url, loading, error }) =>
                            loading ? 'Gerando PDF...' : <><FileDown className="w-4 h-4" /> Exportar Relatório</>
                            }
                        </PDFDownloadLink>
                    </div>
                </div>

                {/* 1. ANOTAÇÕES GERAIS */}
                <div className="bg-ufms-surface p-6 rounded-xl border border-gray-700 shadow-lg mb-8">
                  <label className="text-ufms-gold text-xs font-bold uppercase tracking-wider mb-2 block flex items-center gap-2"><Edit3 className="w-3 h-3"/> Anotações Gerais</label>
                  <textarea value={novaNota} onChange={(e) => setNovaNota(e.target.value)} placeholder="Obs. rápidas, ideias..." className="w-full bg-ufms-carbon border border-gray-600 rounded-lg p-4 text-sm focus:border-ufms-gold outline-none min-h-[60px] mb-4 font-mono text-gray-300"/>
                  <div className="flex justify-end"><button onClick={adicionarNota} className="bg-ufms-gold hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Adicionar</button></div>
                  <div className="space-y-2 mt-4">
                    {notas.map((nota) => (
                        <div key={nota.id} className="bg-ufms-carbon px-4 py-2 rounded border border-gray-700 flex justify-between items-center group">
                            <span className="text-xs text-gray-400 w-24 font-mono">{nota.data}</span>
                            <span className="text-sm text-gray-200 flex-1 whitespace-pre-wrap">{nota.texto}</span>
                            <button onClick={() => removerNota(nota.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    ))}
                  </div>
                </div>

                {/* 2. EXPERIMENTOS REGISTRADOS */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white mb-4 border-l-4 border-ufms-gold pl-3">Experimentos Registrados</h2>
                    {experimentos.length === 0 && <p className="text-gray-500 italic text-sm">Nenhum protocolo salvo ainda.</p>}
                    
                    {experimentos.map((exp) => (
                        <div key={exp.id} className={`bg-ufms-surface rounded-xl border transition-all overflow-hidden ${expandedExpId === exp.id ? 'border-ufms-gold shadow-lg ring-1 ring-ufms-gold/20' : 'border-gray-700 hover:border-gray-500'}`}>
                            
                            {/* Header do Card (Clicável) */}
                            <div className="p-4 flex items-center justify-between cursor-pointer bg-gradient-to-r from-ufms-surface to-ufms-carbon" onClick={() => toggleExpandirExperimento(exp.id)}>
                                <div className="flex items-center gap-4">
                                    <div className="bg-ufms-gold/10 p-2 rounded-lg"><FlaskConical className="w-5 h-5 text-ufms-gold"/></div>
                                    <div>
                                        <h3 className="text-white font-bold">{exp.titulo}</h3>
                                        <p className="text-xs text-gray-400 font-mono">{exp.data} às {exp.hora}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={(e) => removerExperimento(exp.id, e)} className="p-2 text-gray-600 hover:text-red-500 rounded-full hover:bg-gray-800"><Trash2 className="w-4 h-4"/></button>
                                    {expandedExpId === exp.id ? <ChevronUp className="text-ufms-gold"/> : <ChevronDown className="text-gray-500"/>}
                                </div>
                            </div>

                            {/* Conteúdo Expandido */}
                            {expandedExpId === exp.id && (
                                <div className="p-4 border-t border-gray-700 bg-black/20 animate-fadeIn">
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Coluna 1: Protocolo Base */}
                                        <div>
                                            <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-2 block">Protocolo Original</label>
                                            <div className="bg-ufms-carbon p-3 rounded-lg border border-gray-700 h-64 overflow-y-auto custom-scrollbar">
                                                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{exp.protocoloOriginal}</pre>
                                            </div>
                                        </div>

                                        {/* Coluna 2: Dados Dinâmicos */}
                                        <div className="flex flex-col h-full">
                                            
                                            {/* Lista de Solventes */}
                                            <div className="flex-1 mb-4">
                                                <label className="text-[10px] uppercase text-ufms-gold font-bold tracking-wider mb-2 block flex justify-between">
                                                    Solventes Testados
                                                </label>
                                                <div className="bg-ufms-carbon rounded-lg border border-gray-700 overflow-hidden">
                                                    {exp.solventesTestados.map((s, idx) => (
                                                        <div key={idx} className="p-2 border-b border-gray-800 last:border-0 flex justify-between items-center">
                                                            <div>
                                                                <span className="text-sm font-bold text-white block">{s.nome}</span>
                                                                <span className="text-[10px] text-gray-500 italic">{s.obs}</span>
                                                            </div>
                                                            <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-300">{s.tipo || 'Manual'}</span>
                                                        </div>
                                                    ))}
                                                    <div className="p-2 bg-gray-900/50 flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Adicionar outro solvente..." 
                                                            className="flex-1 bg-transparent text-xs text-white outline-none border-b border-gray-600 focus:border-ufms-gold px-1"
                                                            value={novoSolventeInput}
                                                            onChange={(e) => setNovoSolventeInput(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && adicionarSolventeExtra(exp.id)}
                                                        />
                                                        <button onClick={() => adicionarSolventeExtra(exp.id)} className="text-ufms-gold hover:text-white"><PlusCircle className="w-4 h-4"/></button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Observações */}
                                            <div>
                                                <label className="text-[10px] uppercase text-blue-400 font-bold tracking-wider mb-2 block">Observações do Experimento</label>
                                                <textarea 
                                                    className="w-full bg-ufms-carbon border border-gray-600 rounded-lg p-3 text-sm focus:border-blue-400 outline-none text-gray-200 h-24 resize-none"
                                                    placeholder="Resultados visuais, formação de cristais, etc..."
                                                    value={exp.observacoes}
                                                    onChange={(e) => atualizarObservacoes(exp.id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
              </div>
            )}
        </div>
      </main>

      {/* MODAIS (Mantidos) */}
      {zoomedImage && (<div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}><img src={zoomedImage} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" onClick={e=>e.stopPropagation()}/></div>)}
      
      {compareModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4" onClick={() => setCompareModal(null)}>
           <div className="flex justify-between items-center mb-4 px-4"><h2 className="text-ufms-gold font-bold text-xl flex items-center gap-2"><Columns className="w-5 h-5"/> Comparação</h2><button onClick={() => setCompareModal(null)}><X className="w-6 h-6 text-white"/></button></div>
           <div className="flex-1 grid grid-cols-2 gap-4 h-full overflow-hidden pb-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white rounded-xl p-2 flex flex-col relative border-4 border-ufms-gold/50 shadow-[0_0_30px_rgba(201,162,39,0.2)]"><span className="absolute top-4 left-4 bg-ufms-gold text-black font-bold px-3 py-1 rounded text-xs z-10">API</span><div className="flex-1 flex items-center justify-center overflow-hidden"><img src={compareModal.apiImg} className="max-w-full max-h-full object-contain"/></div></div>
              <div className="bg-white rounded-xl p-2 flex flex-col relative border-4 border-gray-600"><span className="absolute top-4 left-4 bg-gray-800 text-white font-bold px-3 py-1 rounded text-xs z-10">{compareModal.acidName}</span><div className="flex-1 flex items-center justify-center overflow-hidden"><img src={compareModal.acidImg} className="max-w-full max-h-full object-contain"/></div></div>
           </div>
        </div>
      )}
      {protocoloModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setProtocoloModal(null)}>
          <div className="bg-ufms-surface w-full max-w-lg rounded-2xl border border-ufms-gold shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-ufms-carbon p-4 border-b border-gray-700 flex justify-between items-center"><h3 className="text-ufms-gold font-bold flex items-center gap-2"><ScrollText className="w-4 h-4"/> Protocolo Experimental</h3><button onClick={() => setProtocoloModal(null)}><X className="w-5 h-5 text-gray-400 hover:text-white"/></button></div>
            <div className="p-6 bg-gray-900 overflow-y-auto max-h-[60vh]"><pre className="text-xs md:text-sm font-mono text-gray-300 whitespace-pre-wrap bg-black/30 p-4 rounded-lg border border-gray-700">{protocoloModal}</pre></div>
            <div className="p-4 bg-ufms-carbon border-t border-gray-700 flex justify-end gap-2"><button onClick={() => setProtocoloModal(null)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white">Fechar</button><button onClick={salvarNoCaderno} className="px-4 py-2 bg-ufms-gold text-black text-xs font-bold rounded-lg hover:bg-yellow-500 flex items-center gap-2"><Notebook className="w-3 h-3"/> Salvar no Caderno</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;