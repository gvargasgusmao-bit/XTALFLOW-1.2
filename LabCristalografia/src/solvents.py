# Banco de dados estático de solventes
SOLVENTES_DB = [
    {"nome": "Água", "bp": 100.0, "dielectric": 80.0, "family": "Inorgânico", "safety": "Verde", "color": "blue"},
    {"nome": "Metanol", "bp": 64.7, "dielectric": 33.0, "family": "Álcool", "safety": "Tóxico", "color": "red"},
    {"nome": "Etanol", "bp": 78.4, "dielectric": 24.5, "family": "Álcool", "safety": "Verde", "color": "green"},
    {"nome": "Acetona", "bp": 56.0, "dielectric": 21.0, "family": "Cetona", "safety": "Verde", "color": "green"},
    {"nome": "Isopropanol (IPA)", "bp": 82.6, "dielectric": 18.0, "family": "Álcool", "safety": "Verde", "color": "green"},
    {"nome": "Acetonitrila", "bp": 82.0, "dielectric": 37.5, "family": "Nitrila", "safety": "Tóxico", "color": "red"},
    {"nome": "Acetato de Etila", "bp": 77.1, "dielectric": 6.0, "family": "Éster", "safety": "Verde", "color": "green"},
    {"nome": "THF (Tetrahidrofurao)", "bp": 66.0, "dielectric": 7.5, "family": "Éter", "safety": "Amarelo", "color": "yellow"},
    {"nome": "DCM (Diclorometano)", "bp": 39.6, "dielectric": 8.9, "family": "Clorado", "safety": "Tóxico", "color": "red"},
    {"nome": "Tolueno", "bp": 110.6, "dielectric": 2.4, "family": "Aromático", "safety": "Amarelo", "color": "yellow"},
    {"nome": "Hexano", "bp": 68.0, "dielectric": 1.9, "family": "Alcano", "safety": "Amarelo", "color": "yellow"},
]

def listar_solventes():
    return sorted(SOLVENTES_DB, key=lambda x: x['bp'])

def sugerir_solvente_por_logp(logp: float):
    """
    Algoritmo de Sugestão baseado em Polaridade:
    - LogP < 0.5 (Hidrofílico) -> Busca solventes polares (Dielectric > 30)
    - LogP 0.5 a 2.5 (Intermediário) -> Busca solventes médios (Dielectric 15-30)
    - LogP > 2.5 (Lipofílico) -> Busca solventes apolares (Dielectric < 15)
    
    Prioridade: Sempre tenta recomendar os 'Verdes' (Seguros) primeiro.
    """
    
    candidatos = []
    categoria = ""

    if logp < 0.5:
        categoria = "Hidrofílico (Polar)"
        # Filtra solventes com alta constante dielétrica
        candidatos = [s for s in SOLVENTES_DB if s['dielectric'] >= 30]
    elif 0.5 <= logp <= 2.5:
        categoria = "Intermediário"
        # Filtra solventes médios
        candidatos = [s for s in SOLVENTES_DB if 15 <= s['dielectric'] < 30]
    else:
        categoria = "Lipofílico (Apolar)"
        # Filtra solventes apolares
        candidatos = [s for s in SOLVENTES_DB if s['dielectric'] < 15]

    # Ordenação Inteligente: Primeiro os Verdes (Segurança), depois menor Ponto de Ebulição (Fácil evaporação)
    # A lógica lambda x: (0 if x['safety'] == 'Verde' else 1, x['bp']) coloca Verdes no topo.
    candidatos.sort(key=lambda x: (0 if x['safety'] == 'Verde' else 1 if x['safety'] == 'Amarelo' else 2, x['bp']))

    melhor_opcao = candidatos[0] if candidatos else SOLVENTES_DB[0] # Fallback para o primeiro
    
    return {
        "sugestao": melhor_opcao,
        "categoria_farmaco": categoria,
        "motivo": f"Para fármacos {categoria.lower()}, recomenda-se {melhor_opcao['nome']} pela polaridade compatível e segurança."
    }