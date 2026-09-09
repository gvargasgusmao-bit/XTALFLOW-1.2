# -*- mode: python ; coding: utf-8 -*-
"""
XtalFlow.spec — PyInstaller spec para a arquitetura FastAPI + React.
Gera um executável single-file que:
  1. Inicia o servidor FastAPI (uvicorn)
  2. Serve o frontend React (web/dist) como arquivos estáticos
  3. Abre o navegador automaticamente
"""
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

# Coletar todos os submodules necessários
hiddenimports = (
    collect_submodules('uvicorn') +
    collect_submodules('fastapi') +
    collect_submodules('starlette') +
    collect_submodules('pydantic') +
    collect_submodules('pydantic_core') +
    ['pandas', 'openpyxl', 'fpdf', 'PIL', 'email_validator',
     'src', 'src.chemistry', 'src.database', 'src.solvents', 'src.utils',
     'src.engines', 'src.engines.hbond']
)

# Dados a empacotar
datas = [
    ('server.py', '.'),
    ('src', 'src'),
    ('data', 'data'),
    ('assets', 'assets'),
    ('web/dist', 'web/dist'),
]

# Adicionar data files de pacotes que precisam
datas += collect_data_files('starlette')
datas += collect_data_files('fastapi')

a = Analysis(
    ['launcher.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['streamlit', 'tkinter', 'matplotlib', 'scipy', 'notebook', 'jupyter'],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='XtalFlow',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Console visível para ver logs do servidor
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
