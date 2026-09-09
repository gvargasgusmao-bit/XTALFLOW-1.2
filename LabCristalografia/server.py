import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

# --- IMPORTAÇÕES DO SEU SISTEMA ---
# Lê os arquivos reais da pasta src
from src.database import carregar_banco_acidos
from src.chemistry import calcular_classificacao
# Importa a lista de solventes do seu módulo existente
from src.solvents import listar_solventes 

# --- ASCII ART XTALFLOW (ADICIONADO) ---
print(r"""
__   __  _        _  _____  _               
\ \ / / | |_ __ _| ||  ___|| | _____      __
 \ V /  | __/ _` | || |_   | |/ _ \ \ /\ / /
 / . \  | || (_| | ||  _|  | | (_) \ V  V / 
/_/ \_\  \__\__,_|_||_|    |_|\___/ \_/\_/  
         v1.0 - Rational Crystal Engineering
""")

# --- CONFIGURAÇÃO DA API (NOME ATUALIZADO) ---
app = FastAPI(title="XtalFlow API", version="1.0.0")

# Configuração de CORS (Para o Frontend acessar)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SERVIR IMAGENS ---
caminho_assets = os.path.join(os.path.dirname(__file__), "assets")
if os.path.exists(caminho_assets):
    app.mount("/assets", StaticFiles(directory=caminho_assets), name="assets")

# --- MODELO DE DADOS ---
class FarmacoInput(BaseModel):
    pka_farmaco: float
    mw_farmaco: float
    massa_base: float
    nome_farmaco: str
    molar_ratio: float
    conc_naoh_mg_ml: float
    logp: Optional[float] = 0.0
    donors_api: int = 0
    acceptors_api: int = 0

class KitajgorodskijInput(BaseModel):
    mw: float
    densidade: float 

class HBondInput(BaseModel):
    distancia: float 
    angulo: float    

# --- LÓGICA DE SUGESTÃO ---
def sugerir_solvente_interno(logp: float):
    lista_real = listar_solventes()
    def buscar(nome):
        for s in lista_real:
            if nome.lower() in s['nome'].lower(): return s
        return lista_real[0] if lista_real else None

    if logp < 1.0:
        return {"sugestao": buscar("água") or buscar("water"), "motivo": "Fármaco hidrofílico (LogP baixo).", "categoria_farmaco": "Hidrofílico"}
    elif 1.0 <= logp < 3.0:
        return {"sugestao": buscar("etanol"), "motivo": "Lipofilicidade moderada.", "categoria_farmaco": "Moderado"}
    else:
        return {"sugestao": buscar("acetato") or buscar("etila"), "motivo": "Fármaco lipofílico.", "categoria_farmaco": "Lipofílico"}

# --- ROTAS ---

@app.get("/solventes")
def get_solventes():
    return listar_solventes()

@app.post("/calcular")
def calcular(dados: FarmacoInput):
    df = carregar_banco_acidos()
    resultados = []
    
    mols_farmaco = (dados.massa_base / 1000) / dados.mw_farmaco
    mols_acido_necessario = mols_farmaco * dados.molar_ratio

    for _, row in df.iterrows():
        try:
            pka_acido = float(str(row['pka']).replace(',', '.'))
            mw_acido = float(str(row['mw']).replace(',', '.'))
            
            delta_pka = dados.pka_farmaco - pka_acido
            classificacao, cor, desc = calcular_classificacao(delta_pka)

            try:
                acid_d = int(row['h_donors']) if 'h_donors' in row and str(row['h_donors']) != 'nan' else 0
                acid_a = int(row['h_acceptors']) if 'h_acceptors' in row and str(row['h_acceptors']) != 'nan' else 0
            except:
                acid_d, acid_a = 0, 0 

            hb_score = -1
            if dados.donors_api > 0 or dados.acceptors_api > 0:
                hb_score = abs(dados.donors_api - acid_a) + abs(dados.acceptors_api - acid_d)

            massa_acido_mg = (mols_acido_necessario * mw_acido) * 1000
            mols_naoh = mols_acido_necessario
            vol_naoh_microlitros = (mols_naoh * 40.0 * 1000 / (dados.conc_naoh_mg_ml or 1)) * 1000
            
            imagem_nome = str(row['imagem'])
            if row['imagem'] and imagem_nome != "nan" and imagem_nome != "":
                imagem_url = f"http://localhost:8000/assets/maps_acidos/{imagem_nome}"
            else:
                imagem_url = None

            resultados.append({
                "nome_acido": row['nome'],
                "delta_pka": round(delta_pka, 2),
                "classificacao": classificacao,
                "cor": cor,
                "descricao": desc,
                "massa_pesar": round(massa_acido_mg, 2),
                "imagem_url": imagem_url,
                "vol_naoh": round(vol_naoh_microlitros, 1),
                "alerta_pipeta": vol_naoh_microlitros > 1000,
                "hbond_score": hb_score
            })
        except Exception as e:
            print(f"Erro linha {row.get('nome', '?')}: {e}")
            continue

    resultados.sort(key=lambda x: (
        x['delta_pka'] > 3, 
        -x['hbond_score'] if x['hbond_score'] != -1 else 0, 
        x['delta_pka']
    ), reverse=True)

    sugestao_ia = sugerir_solvente_interno(dados.logp)

    return {
        "lista_acidos": resultados,
        "sugestao_solvente": sugestao_ia
    }

@app.post("/ferramentas/kitajgorodskij")
def calc_kp(data: KitajgorodskijInput):
    if data.densidade <= 0 or data.mw <= 0:
        return {"kp": 0, "status": "Erro", "cor": "gray", "desc": "Dados inválidos"}

    kp = data.densidade * 0.60 
    kp_percent = round(kp * 100, 1)
    
    if kp_percent < 65:
        return {
            "kp": kp_percent, 
            "status": "Baixo Empacotamento (Alerta de Solvato)", 
            "cor": "red",
            "desc": "Há muito espaço vazio na rede. Risco alto de formar solvatos ou hidratos instáveis."
        }
    elif 65 <= kp_percent <= 77:
        return {
            "kp": kp_percent, 
            "status": "Empacotamento Ideal (Kitajgorodskij)", 
            "cor": "green",
            "desc": "O cristal segue a regra de Kitajgorodskij. Alta probabilidade de estabilidade física."
        }
    else:
        return {
            "kp": kp_percent, 
            "status": "Densidade Atípica (Alta)", 
            "cor": "yellow",
            "desc": "Valor acima do limite teórico para orgânicos leves. Verifique se há átomos pesados (S, Cl, Br)."
        }

@app.post("/ferramentas/hbond")
def validar_hbond(data: HBondInput):
    d = data.distancia
    ang = data.angulo
    
    tipo = "Sem Interação"
    energia = "N/A"
    cor = "gray"
    desc = "Geometria desfavorável para ligação de hidrogênio."
    
    if ang < 90:
        return {
            "tipo": "Ângulo Inválido",
            "energia": "Repulsão",
            "cor": "red",
            "desc": "O ângulo é muito agudo (<90°). Improvável formação de H-Bond."
        }

    if d < 2.2:
        tipo = "H-Bond Muito Forte (Quase Covalente)"
        energia = "15-40 kcal/mol"
        cor = "purple"
        desc = "Rara em orgânicos puros. Comum em sais fortes ou complexos metálicos."
    elif 2.2 <= d <= 2.5:
        tipo = "H-Bond Forte"
        energia = "4-15 kcal/mol"
        cor = "green"
        desc = "Interação primária. Define a estrutura cristalina principal."
    elif 2.5 < d <= 3.2:
        if ang >= 130:
            tipo = "H-Bond Moderada (Clássica)"
            energia = "4-15 kcal/mol"
            cor = "green"
            desc = "A mais comum em fármacos. Predominantemente eletrostática."
        else:
            tipo = "H-Bond Moderada (Distorcida)"
            energia = "Media/Baixa"
            cor = "yellow"
            desc = "Distância boa, mas ângulo ruim. Interação enfraquecida."
    elif 3.2 < d <= 4.0:
        tipo = "H-Bond Fraca (Van der Waals)"
        energia = "<4 kcal/mol"
        cor = "gray"
        desc = "Auxiliar no empacotamento, mas não direciona a estrutura."
    
    return { "tipo": tipo, "energia": energia, "cor": cor, "desc": desc }

# --- SERVIR FRONTEND ESTÁTICO (React Build) ---
def _get_base_path():
    """Retorna caminho base (compatível com PyInstaller .exe)"""
    try:
        return sys._MEIPASS
    except Exception:
        return os.path.dirname(os.path.abspath(__file__))

caminho_frontend = os.path.join(_get_base_path(), "web", "dist")
if os.path.exists(caminho_frontend):
    app.mount("/app", StaticFiles(directory=caminho_frontend, html=True), name="frontend")

@app.get("/")
def root():
    """Redireciona para o frontend React"""
    return RedirectResponse(url="/app/")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)