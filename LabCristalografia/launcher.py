"""
XtalFlow Launcher — Entry point para o executável PyInstaller.
Inicia o servidor FastAPI e abre o navegador automaticamente.
"""
import sys
import os
import threading
import webbrowser
import time
import uvicorn

def get_base_path():
    """Retorna caminho base (compatível com PyInstaller .exe)"""
    try:
        return sys._MEIPASS
    except Exception:
        return os.path.dirname(os.path.abspath(__file__))

def open_browser():
    """Abre o navegador após um curto delay para o server iniciar"""
    time.sleep(2)
    webbrowser.open("http://localhost:8000/")

if __name__ == "__main__":
    # Garante que o working directory está correto para o PyInstaller
    os.chdir(get_base_path())
    sys.path.insert(0, get_base_path())

    print(r"""
    __   __  _        _  _____  _               
    \ \ / / | |_ __ _| ||  ___|| | _____      __
     \ V /  | __/ _` | || |_   | |/ _ \ \ /\ / /
     / . \  | || (_| | ||  _|  | | (_) \ V  V / 
    /_/ \_\  \__\__,_|_||_|    |_|\___/ \_/\_/  
             v1.0 - Rational Crystal Engineering
    
    [INFO] Iniciando servidor em http://localhost:8000
    [INFO] Pressione Ctrl+C para encerrar.
    """)

    # Abre o navegador em uma thread separada
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()

    # Importa e roda o servidor
    from server import app
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
