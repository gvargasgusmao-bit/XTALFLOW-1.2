import sys
import os
from PIL import Image
import pandas as pd

def resource_path(relative_path):
    """Retorna caminho absoluto (compatível com .exe)"""
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

def load_image_asset(nome_arquivo):
    """Carrega imagem da pasta assets/maps_acidos"""
    if pd.isna(nome_arquivo): return None
    nome_arquivo = str(nome_arquivo).strip()
    caminho = resource_path(os.path.join("assets", "maps_acidos", nome_arquivo))
    
    if os.path.exists(caminho):
        return Image.open(caminho)
    return None