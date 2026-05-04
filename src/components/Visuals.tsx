import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#2563eb', '#dc2626', '#d97706', '#059669', '#7c3aed', '#db2777'];

export const KpiLineChart = ({ data, xKey, yKey, name, color = '#2563eb' }: {
  data: any[]; xKey: string; yKey: string; name: string; color?: string;
}) => (
  <div className="h-[250px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis 
          dataKey={xKey} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
          tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : v}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}
        />
        <Line 
          type="monotone" 
          dataKey={yKey} 
          name={name} 
          stroke={color} 
          strokeWidth={3} 
          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const KpiBarChart = ({ data, xKey, yKey, name, color = '#2563eb' }: {
  data: any[]; xKey: string; yKey: string; name: string; color?: string;
}) => (
  <div className="h-[250px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis 
          dataKey={xKey} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
          tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : v}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        <Bar 
          dataKey={yKey} 
          name={name} 
          fill={color} 
          radius={[4, 4, 0, 0]} 
          barSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const KpiPieChart = ({ data, nameKey, valueKey }: {
  data: any[]; nameKey: string; valueKey: string;
}) => (
  <div className="h-[250px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          nameKey={nameKey}
          dataKey={valueKey}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" align="center" iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
