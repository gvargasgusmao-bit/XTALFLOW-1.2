import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Estilos estilo "ABNT/Paper"
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, color: '#000' },
  header: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#999', paddingBottom: 10, marginBottom: 20 },
  headerText: { flexDirection: 'col' },
  title: { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' },
  subtitle: { fontSize: 10, color: '#666', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 100, fontWeight: 'bold', color: '#444' },
  value: { flex: 1 },
  
  // Tabela Simples
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', padding: 5, marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', padding: 5 },
  col1: { width: '40%' },
  col2: { width: '20%' },
  col3: { width: '40%' },
  
  // Caixa de Experimento
  expBox: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 4 },
  expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, backgroundColor: '#f9f9f9', padding: 4 },
  obsText: { fontStyle: 'italic', color: '#555', marginTop: 5, fontSize: 10 }
});

const RelatorioPDF = ({ farmaco, resultados, experimentos }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Relatório de Screening</Text>
          <Text style={styles.subtitle}>Laboratório de Cristalografia - UFMS</Text>
          <Text style={styles.subtitle}>Gerado em: {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}</Text>
        </View>
      </View>

      {/* 1. DADOS DO API */}
      <Text style={styles.sectionTitle}>1. Molécula Alvo (API)</Text>
      <View style={styles.row}><Text style={styles.label}>Nome:</Text><Text style={styles.value}>{farmaco.nome || 'Não informado'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>pKa:</Text><Text style={styles.value}>{farmaco.pka}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Peso Molecular:</Text><Text style={styles.value}>{farmaco.mw} g/mol</Text></View>
      <View style={styles.row}><Text style={styles.label}>LogP:</Text><Text style={styles.value}>{farmaco.logp || 'N/A'}</Text></View>

      {/* 2. TOP CANDIDATOS (SCREENING) */}
      <Text style={styles.sectionTitle}>2. Screening Virtual (Top 5 Candidatos)</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.col1, {fontWeight:'bold'}]}>Co-formador (Ácido)</Text>
        <Text style={[styles.col2, {fontWeight:'bold'}]}>ΔpKa</Text>
        <Text style={[styles.col3, {fontWeight:'bold'}]}>Classificação</Text>
      </View>
      {resultados.slice(0, 5).map((res, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.col1}>{res.nome_acido}</Text>
          <Text style={styles.col2}>{res.delta_pka.toFixed(2)}</Text>
          <Text style={styles.col3}>{res.classificacao}</Text>
        </View>
      ))}

      {/* 3. CADERNO DE LABORATÓRIO */}
      <Text style={styles.sectionTitle}>3. Registros Experimentais</Text>
      {experimentos.length === 0 ? (
        <Text style={{color: '#999', fontStyle: 'italic'}}>Nenhum experimento registrado no caderno.</Text>
      ) : (
        experimentos.map((exp) => (
          <View key={exp.id} style={styles.expBox}>
            <View style={styles.expHeader}>
              <Text style={{fontWeight: 'bold'}}>{exp.titulo}</Text>
              <Text style={{fontSize: 9}}>{exp.data}</Text>
            </View>
            
            <Text style={{fontSize: 9, marginBottom: 4}}>Protocolo Base:</Text>
            <Text style={{fontSize: 9, color: '#333', marginBottom: 8}}>{exp.protocoloOriginal.split('\n').slice(0, 3).join(', ')}...</Text>
            
            <Text style={{fontSize: 9, fontWeight: 'bold'}}>Solventes Testados:</Text>
            {exp.solventesTestados.map((s, idx) => (
               <Text key={idx} style={{fontSize: 9, marginLeft: 10}}>• {s.nome} ({s.tipo})</Text>
            ))}

            {exp.observacoes ? (
                <View>
                    <Text style={{fontSize: 9, fontWeight: 'bold', marginTop: 5}}>Observações:</Text>
                    <Text style={styles.obsText}>"{exp.observacoes}"</Text>
                </View>
            ) : null}
          </View>
        ))
      )}
      
      <Text style={{position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#ccc'}}>
        Este documento é um auxílio à pesquisa e não substitui validação experimental.
      </Text>
    </Page>
  </Document>
);

export default RelatorioPDF;