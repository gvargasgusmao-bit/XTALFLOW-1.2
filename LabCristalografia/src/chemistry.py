def calcular_classificacao(delta_pka):
    """Retorna: (Titulo, Cor, Descrição)"""
    if delta_pka >= 3:
        return "Sal", "success", "Provável Sal (Transferência de próton)"
    elif delta_pka < 0:
        return "Cocristal", "info", "Provável Cocristal (Interação neutra)"
    else:
        return "Zona Cinzenta", "warning", "Estado de ionização imprevisível"

def calcular_estequiometria(massa_base, mw_base, mw_acido):
    """Calcula massa necessária para 1:1"""
    if mw_base > 0:
        mols = massa_base / mw_base
        return mols * mw_acido
    return 0.0