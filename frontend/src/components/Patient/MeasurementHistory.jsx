import { useState, useEffect } from 'react';
import { 
    LineChart, Line, 
    AreaChart, Area,
    BarChart, Bar,
    ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { TrendingUp, Calendar, Heart, Scale, Moon, Activity } from 'lucide-react';
import { measurementsAPI } from '../../services/api';

const MEASUREMENT_TYPES = {
    TENSION: { label: 'Blood Pressure', color: '#ef4444', unit: 'mmHg', icon: Heart, gradient: ['#fecaca', '#ef4444'] },
    POIDS: { label: 'Weight', color: '#0ea5e9', unit: 'kg', icon: Scale, gradient: ['#e0f2fe', '#0ea5e9'] },
    SOMMEIL: { label: 'Sleep', color: '#8b5cf6', unit: 'hours', icon: Moon, gradient: ['#ede9fe', '#8b5cf6'] },
    ACTIVITE: { label: 'Activity', color: '#10b981', unit: 'steps', icon: Activity, gradient: ['#d1fae5', '#10b981'] },
};

export default function MeasurementHistory() {
    const [selectedType, setSelectedType] = useState('TENSION');
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30'); 

    useEffect(() => {
        fetchMeasurements();
    }, [selectedType, dateRange]);

    const fetchMeasurements = async () => {
        setLoading(true);
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(dateRange));

            const response = await measurementsAPI.getAll({
                type: selectedType,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                limit: 100,
            });

            console.log('Measurements API response:', response);
            
            if (response.success) {
                setMeasurements(response.data || []);
            } else {
                setMeasurements([]);
            }
        } catch (error) {
            console.error('Failed to fetch measurements:', error);
            setMeasurements([]);
        } finally {
            setLoading(false);
        }
    };

    const formatChartData = () => {
        return measurements.map(m => {
            const date = new Date(m.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            if (selectedType === 'TENSION') {
                return {
                    date,
                    systolic: parseInt(m.data.systolique, 10) || 0,
                    diastolic: parseInt(m.data.diastolique, 10) || 0,
                };
            } else if (selectedType === 'POIDS') {
                return {
                    date,
                    value: parseFloat(m.data.kg) || 0,
                };
            } else if (selectedType === 'SOMMEIL') {
                return {
                    date,
                    value: parseFloat(m.data.hours) || 0,
                };
            } else if (selectedType === 'ACTIVITE') {
                return {
                    date,
                    steps: parseInt(m.data.steps, 10) || 0,
                    minutes: parseInt(m.data.minutes, 10) || 0,
                };
            }
            return { date };
        }).reverse(); 
    };

    const chartData = formatChartData();
    const typeConfig = MEASUREMENT_TYPES[selectedType];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Measurement History</h2>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-3">
                {Object.entries(MEASUREMENT_TYPES).map(([key, type]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedType(key)}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${selectedType === key
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-105'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            <div className="glass-card p-6">
                {loading ? (
                    <div className="h-80 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                        <TrendingUp className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No data available</p>
                        <p className="text-sm">Add measurements to see your trends</p>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">
                            {typeConfig.label} Trends
                        </h3>
                        <ResponsiveContainer width="100%" height={350}>
                            {selectedType === 'TENSION' ? (
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="systolicGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                                        </linearGradient>
                                        <linearGradient id="diastolicGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                                    <YAxis 
                                        stroke="#64748b" 
                                        style={{ fontSize: '12px' }}
                                        domain={[60, 180]}
                                        label={{ value: 'mmHg', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#64748b' } }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '12px'
                                        }}
                                        formatter={(value, name) => [`${value} mmHg`, name]}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                                    <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Normal Sys', fill: '#22c55e', fontSize: 10 }} />
                                    <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Normal Dia', fill: '#22c55e', fontSize: 10 }} />
                                    <Area
                                        type="monotone"
                                        dataKey="systolic"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        fill="url(#systolicGradient)"
                                        name="Systolic"
                                        dot={{ fill: '#ef4444', r: 4 }}
                                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="diastolic"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fill="url(#diastolicGradient)"
                                        name="Diastolic"
                                        dot={{ fill: '#3b82f6', r: 4 }}
                                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            ) : selectedType === 'POIDS' ? (
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                                    <YAxis 
                                        stroke="#64748b" 
                                        style={{ fontSize: '12px' }}
                                        domain={['dataMin - 5', 'dataMax + 5']}
                                        label={{ value: 'kg', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#64748b' } }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '12px'
                                        }}
                                        formatter={(value) => [`${value} kg`, 'Weight']}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#0ea5e9"
                                        strokeWidth={3}
                                        fill="url(#weightGradient)"
                                        name="Weight"
                                        dot={{ fill: '#0ea5e9', r: 5, stroke: '#fff', strokeWidth: 2 }}
                                        activeDot={{ r: 8, stroke: '#0ea5e9', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            ) : selectedType === 'SOMMEIL' ? (
                                <BarChart data={chartData}>
                                    <defs>
                                        <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                                            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.8}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                                    <YAxis 
                                        stroke="#64748b" 
                                        style={{ fontSize: '12px' }}
                                        domain={[0, 12]}
                                        ticks={[0, 2, 4, 6, 8, 10, 12]}
                                        label={{ value: 'hours', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#64748b' } }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '12px'
                                        }}
                                        formatter={(value) => [`${value} hours`, 'Sleep']}
                                        cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                                    <ReferenceLine y={8} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Recommended (8h)', fill: '#22c55e', fontSize: 10, position: 'right' }} />
                                    <Bar
                                        dataKey="value"
                                        fill="url(#sleepGradient)"
                                        name="Sleep Duration"
                                        radius={[8, 8, 0, 0]}
                                        maxBarSize={50}
                                    />
                                </BarChart>
                            ) : selectedType === 'ACTIVITE' ? (
                                <ComposedChart data={chartData}>
                                    <defs>
                                        <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                                            <stop offset="100%" stopColor="#34d399" stopOpacity={0.8}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                                    <YAxis 
                                        yAxisId="left"
                                        stroke="#10b981" 
                                        style={{ fontSize: '12px' }}
                                        label={{ value: 'steps', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#10b981' } }}
                                    />
                                    <YAxis 
                                        yAxisId="right"
                                        orientation="right"
                                        stroke="#f59e0b" 
                                        style={{ fontSize: '12px' }}
                                        label={{ value: 'min', angle: 90, position: 'insideRight', style: { fontSize: '12px', fill: '#f59e0b' } }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '12px'
                                        }}
                                        formatter={(value, name) => {
                                            if (name === 'Steps') return [`${value.toLocaleString()} steps`, name];
                                            return [`${value} min`, name];
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                                    <ReferenceLine yAxisId="left" y={10000} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Goal: 10k', fill: '#22c55e', fontSize: 10 }} />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="steps"
                                        fill="url(#stepsGradient)"
                                        name="Steps"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="minutes"
                                        stroke="#f59e0b"
                                        strokeWidth={3}
                                        dot={{ fill: '#f59e0b', r: 5, stroke: '#fff', strokeWidth: 2 }}
                                        activeDot={{ r: 7 }}
                                        name="Duration"
                                    />
                                </ComposedChart>
                            ) : (
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="value" stroke={typeConfig.color} strokeWidth={3} />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {chartData.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="glass-card p-4 text-center">
                        <p className="text-sm text-slate-600 mb-1">Total Records</p>
                        <p className="text-2xl font-bold text-primary-600">{chartData.length}</p>
                    </div>
                    
                    {selectedType === 'TENSION' && (
                        <>
                            <div className="glass-card p-4 text-center">
                                <p className="text-sm text-slate-600 mb-1">Latest Reading</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {chartData[chartData.length - 1]?.systolic}/{chartData[chartData.length - 1]?.diastolic}
                                    <span className="text-sm font-normal text-slate-500 ml-1">mmHg</span>
                                </p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <p className="text-sm text-slate-600 mb-1">Avg Systolic</p>
                                <p className="text-2xl font-bold text-red-500">
                                    {(chartData.reduce((sum, d) => sum + (d.systolic || 0), 0) / chartData.length).toFixed(0)}
                                    <span className="text-sm font-normal text-slate-500 ml-1">mmHg</span>
                                </p>
                            </div>
                        </>
                    )}
                    
                    {selectedType === 'POIDS' && (
                        <>
                            <div className="glass-card p-4 text-center">
                                <p className="text-sm text-slate-600 mb-1">Latest Weight</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {chartData[chartData.length - 1]?.value}
                                    <span className="text-sm font-normal text-slate-500 ml-1">kg</span>
                                </p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <p className="text-sm text-slate-600 mb-1">Change</p>
                                <p className={`text-2xl font-bold ${
                                    (chartData[chartData.length - 1]?.value - chartData[0]?.value) > 0 
                                        ? 'text-orange-500' 
                                        : 'text-green-500'
                                }`}>
                                    {((chartData[chartData.length - 1]?.value || 0) - (chartData[0]?.value || 0)).toFixed(1)}
                                    <span className="text-sm font-normal text-slate-500 ml-1">kg</span>
                                </p>
                            </div>
                        </>
                    )}
                    
                    {selectedType === 'SOMMEIL' && (
                        <>
                            <div className="glass-card p-4 text-center">
                                <p className="text-sm text-slate-600 mb-1">Last Night</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {chartData[chartData.length - 1]?.value}
                                    <span className="text-sm font-normal text-slate-500 ml-1">hours</span>
                                </p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <p className="text-sm text-slate-600 mb-1">Average Sleep</p>
                                <p className={`text-2xl font-bold ${
                                    (chartData.reduce((sum, d) => sum + (d.value || 0), 0) / chartData.length) >= 7 
                                        ? 'text-green-500' 
                                        : 'text-orange-500'
                                }`}>
                                    {(chartData.reduce((sum, d) => sum + (d.value || 0), 0) / chartData.length).toFixed(1)}
                                    <span className="text-sm font-normal text-slate-500 ml-1">hours</span>
                                </p>
                            </div>
                        </>
                    )}
                    
                    {selectedType === 'ACTIVITE' && (
                        <>
                            <div className="glass-card p-4 text-center">
                                <p className="text-sm text-slate-600 mb-1">Total Steps</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {chartData.reduce((sum, d) => sum + (parseInt(d.steps, 10) || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <p className="text-sm text-slate-600 mb-1">Daily Average</p>
                                <p className={`text-2xl font-bold ${
                                    (chartData.reduce((sum, d) => sum + (parseInt(d.steps, 10) || 0), 0) / chartData.length) >= 10000 
                                        ? 'text-green-500' 
                                        : 'text-amber-500'
                                }`}>
                                    {Math.round(chartData.reduce((sum, d) => sum + (parseInt(d.steps, 10) || 0), 0) / chartData.length).toLocaleString()}
                                    <span className="text-sm font-normal text-slate-500 ml-1">steps</span>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
