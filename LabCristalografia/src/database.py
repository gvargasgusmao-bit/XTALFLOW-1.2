import pandas as pd
import os
from .utils import resource_path

def carregar_banco_acidos():
    caminho_excel = resource_path(os.path.join("data", "acidos_db.xlsx"))
    try:
        df = pd.read_excel(caminho_excel)
        df.columns = [str(c).lower().strip() for c in df.columns]
        return df
    except FileNotFoundError:
        return pd.DataFrame()