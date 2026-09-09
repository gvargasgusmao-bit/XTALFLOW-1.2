import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell
} from 'recharts';

const DeltaChart = ({ data }) => {
  // Pega os top 10 e inverte para o melhor ficar no topo
  const chartData = data.slice(0, 10);

  return (
    <div className="w-full h-[350px] bg-transparent border-b border-gray-800 mb-8 pb-4">
      <div className="flex justify-between items-end mb-2 px-2">
        <h3 className="text-gray-400 font-medium text-xs uppercase tracking-widest">
          Distribuição de ΔpKa
        </h3>
        <span className="text-[10px] text-gray-500 italic">
          *Linha tracejada indica limite de estabilidade (ΔpKa = 3)
        </span>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical" // Muda para horizontal
          data={chartData}
          margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
        >
          {/* Grid apenas vertical e muito sutil */}
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" opacity={0.5} />
          
          <XAxis 
            type="number" 
            domain={[-5, 'auto']} // Garante que mostre valores negativos se houver
            tick={{ fill: '#6b7280', fontSize: 10 }} 
            axisLine={{ stroke: '#374151' }}
          />
          
          <YAxis 
            dataKey="nome_acido" 
            type="category" 
            width={100}
            tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }} 
            axisLine={false}
            tickLine={false}
          />
          
          <Tooltip 
            cursor={{fill: 'rgba(255,255,255,0.05)'}}
            contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '0px', padding: '8px' }}
            itemStyle={{ color: '#fff', fontSize: '12px' }}
            formatter={(value) => [value.toFixed(2), 'ΔpKa']}
            labelStyle={{ color: '#9ca3af', fontSize: '10px', textTransform: 'uppercase', marginBottom: '5px' }}
          />
          
          {/* Linha de Corte Discreta (Ouro) */}
          <ReferenceLine x={3} stroke="#C9A227" strokeDasharray="5 5" strokeOpacity={0.8} />

          {/* Barras Finas e Elegantes */}
          <Bar dataKey="delta_pka" barSize={12} radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                // Se for maior que 3 (Sal), usa o Dourado da UFMS. Se não, usa cinza chumbo.
                fill={entry.delta_pka >= 3 ? '#C9A227' : '#4b5563'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DeltaChart;