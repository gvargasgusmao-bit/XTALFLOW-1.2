CSS_GLOBAL = """
<style>
    /* Importando fonte Inter para modernidade */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

    html, body, [class*="css"]  {
        font-family: 'Inter', sans-serif;
    }

    /* --- 1. ESTILO DO LOGO (BRASÃO) --- */
    div[data-testid="stSidebar"] img {
        display: block;
        margin-left: auto;
        margin-right: auto;
        width: 180px; /* Tamanho fixo para impor presença */
        border-radius: 50%; /* Garante que fique redondo como uma moeda */
        border: 3px solid #C9A227; /* Borda Dourada ao redor do logo */
        box-shadow: 0 0 15px rgba(201, 162, 39, 0.3); /* Brilho dourado suave */
        margin-bottom: 25px;
        background-color: white; /* Garante fundo branco pro logo se destacar no modo escuro */
        padding: 5px; /* Espaço entre o logo e a borda dourada */
    }

    /* --- 2. TÍTULOS --- */
    h1 {
        color: #C9A227; /* Título Dourado */
        font-weight: 700;
        border-bottom: 1px solid #333;
        padding-bottom: 10px;
    }
    
    h2, h3 {
        color: #E0E0E0;
        font-weight: 600;
    }

    /* --- 3. CARDS DOS ÁCIDOS --- */
    .acid-card {
        background-color: #1E2129;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #363B47;
        margin-bottom: 16px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    /* Efeito de Hover (Passar o mouse) */
    .acid-card:hover {
        border-color: #C9A227; /* Borda vira Dourada */
        transform: translateY(-2px); /* Sobe levemente */
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    }
    
    /* Pequena barra dourada decorativa à esquerda do card */
    .acid-card::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 4px;
        background-color: #C9A227;
        opacity: 0.5;
    }

    /* --- 4. MÉTRICAS E TEXTOS --- */
    div[data-testid="stMetricValue"] {
        color: #C9A227 !important; /* Números em Dourado */
        font-weight: 700;
    }
    
    .stAlert {
        border-radius: 8px; /* Alertas mais suaves */
    }

    /* --- 5. TUTORIAL STEPS --- */
    .tutorial-step {
        background-color: #161920; 
        padding: 20px; 
        border-radius: 12px;
        text-align: center; 
        border: 1px dashed #444;
        height: 100%;
    }
    .step-icon { 
        font-size: 40px; 
        margin-bottom: 10px;
        background: -webkit-linear-gradient(#FDD835, #C9A227);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    /* Botões */
    .stButton button {
        border-radius: 20px;
        font-weight: bold;
    }

</style>
"""