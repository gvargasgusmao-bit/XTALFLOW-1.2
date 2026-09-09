import math

def calcular_propensao_hbond(d_api: int, a_api: int, d_co: int, a_co: int):
    """
    Calcula o Score de Complementaridade de Ligações de Hidrogênio.
    
    Baseado na premissa de que para um cocristal estável, todos os bons doadores
    e aceitadores devem ser satisfeitos (Regra de Etter / Best Donor-Best Acceptor).
    
    Fórmula: Score = |D_api - A_co| + |A_api - D_co|
    
    Quanto MENOR o score, MELHOR a complementaridade.
    """
    
    # Validação de segurança para inputs vazios
    d_api = d_api or 0
    a_api = a_api or 0
    d_co = d_co or 0
    a_co = a_co or 0

    # O Cálculo Matemático (Regra dos 12 simplificada para pares)
    desbalanceamento_doadores = abs(d_api - a_co)
    desbalanceamento_aceitadores = abs(a_api - d_co)
    
    score = desbalanceamento_doadores + desbalanceamento_aceitadores

    # Interpretação Científica do Resultado
    if score == 0:
        qualidade = "Excelente (Complementaridade Total)"
        motivo = "Todos os sítios de H-Bond potenciais podem ser satisfeitos teoricamente."
        cor_score = "green"
    elif score <= 2:
        qualidade = "Bom (Provável Formação)"
        motivo = "Pequeno desbalanço, mas redes de H-Bond flexíveis podem acomodar."
        cor_score = "blue"
    elif score <= 4:
        qualidade = "Moderado (Risco de Instabilidade)"
        motivo = "Desbalanço significativo. Risco de o API preferir cristalizar sozinho."
        cor_score = "orange"
    else:
        qualidade = "Baixo (Improvável)"
        motivo = "Incompatibilidade geométrica de sítios. Alta chance de falha."
        cor_score = "red"

    return {
        "score_hbond": score,
        "qualidade_hbond": qualidade,
        "motivo_hbond": motivo,
        "cor_hbond": cor_score,
        "detalhes": {
            "api_donors": d_api,
            "api_acceptors": a_api,
            "coformer_donors": d_co,
            "coformer_acceptors": a_co
        }
    }