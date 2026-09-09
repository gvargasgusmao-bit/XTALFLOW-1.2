from fpdf import FPDF
from datetime import datetime
from .chemistry import calcular_classificacao

class PDFRelatorio(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Relatório de Screening - CristaloLab', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Pagina {self.page_no()}', 0, 0, 'C')

def gerar_pdf_bytes(df, pka_farm, mw_farm, nome_farm, massa_base):
    pdf = PDFRelatorio()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    # Cabeçalho
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, f"Farmaco (API): {nome_farm}", ln=True)
    pdf.set_font("Arial", size=10)
    pdf.cell(0, 5, f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M')}", ln=True)
    pdf.cell(0, 5, f"pKa API: {pka_farm} | MW API: {mw_farm} g/mol", ln=True)
    pdf.cell(0, 5, f"Base de Calculo: {massa_base}g de API", ln=True)
    pdf.ln(10)
    
    # Tabela Header
    pdf.set_fill_color(200, 220, 255)
    pdf.set_font("Arial", 'B', 10)
    pdf.cell(60, 8, "Coformador", 1, 0, 'C', 1)
    pdf.cell(30, 8, "Delta pKa", 1, 0, 'C', 1)
    pdf.cell(40, 8, "Previsao", 1, 0, 'C', 1)
    pdf.cell(40, 8, "Pesar (g)", 1, 1, 'C', 1)
    
    # Tabela Dados
    pdf.set_font("Arial", size=10)
    
    for _, row in df.iterrows():
        try:
            nome = str(row['nome'])
            pka_ac = float(str(row['pka']).replace(',', '.'))
            mw_ac = float(str(row['mw']).replace(',', '.'))
            
            delta = pka_farm - pka_ac
            classif_curta, _, _ = calcular_classificacao(delta)
            
            # Cálculo Local (pois o PDF não acessa o módulo chemistry diretamente aqui para evitar loops)
            mols = massa_base / mw_farm if mw_farm > 0 else 0
            massa_ac = mols * mw_ac
            
            pdf.cell(60, 8, nome[:25], 1) 
            pdf.cell(30, 8, f"{delta:.2f}", 1, 0, 'C')
            pdf.cell(40, 8, classif_curta, 1, 0, 'C')
            pdf.cell(40, 8, f"{massa_ac:.3f}", 1, 1, 'C')
        except:
            continue
            
    return pdf.output(dest='S').encode('latin-1', 'replace')