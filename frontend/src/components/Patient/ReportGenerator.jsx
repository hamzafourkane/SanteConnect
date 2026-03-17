import { useState } from 'react';
import { reportsAPI } from '../../services/api';
import { FileText, Download, Calendar, X, Loader, Printer } from 'lucide-react';

export default function ReportGenerator({ onClose }) {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [dateRange, setDateRange] = useState({
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const response = await reportsAPI.generate(dateRange);
            if (response.success) {
                setReportData(response.report);
            }
        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setLoading(true);
        try {
            const response = await reportsAPI.getHtml(dateRange);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(response);
            printWindow.document.close();
            printWindow.focus();
            
            setTimeout(() => {
                printWindow.print();
            }, 500);
        } catch (error) {
            console.error('Failed to download report:', error);
            alert('Failed to generate PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white">
                            <FileText className="w-8 h-8" />
                            <div>
                                <h2 className="text-2xl font-bold">Health Report</h2>
                                <p className="text-emerald-100 text-sm">Generate a PDF summary of your health data</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Select Date Range
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={dateRange.start_date}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={dateRange.end_date}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {reportData && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-3">Report Preview</h3>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-white rounded-lg">
                                    <p className="text-slate-500">Total Measurements</p>
                                    <p className="text-2xl font-bold text-emerald-600">{reportData.summary.total_measurements}</p>
                                </div>
                                <div className="p-3 bg-white rounded-lg">
                                    <p className="text-slate-500">Health Alerts</p>
                                    <p className="text-2xl font-bold text-amber-600">{reportData.summary.total_alerts}</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                {reportData.statistics.TENSION.count > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">🩺 Avg Blood Pressure:</span>
                                        <span className="font-medium">{reportData.statistics.TENSION.avg_systolic}/{reportData.statistics.TENSION.avg_diastolic} mmHg</span>
                                    </div>
                                )}
                                {reportData.statistics.POIDS.count > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">⚖️ Avg Weight:</span>
                                        <span className="font-medium">{reportData.statistics.POIDS.avg} kg</span>
                                    </div>
                                )}
                                {reportData.statistics.SOMMEIL.count > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">😴 Avg Sleep:</span>
                                        <span className="font-medium">{reportData.statistics.SOMMEIL.avg} hours</span>
                                    </div>
                                )}
                                {reportData.statistics.ACTIVITE.count > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">🏃 Avg Steps:</span>
                                        <span className="font-medium">{reportData.statistics.ACTIVITE.avg_steps.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            {reportData.recommendations?.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-slate-700 mb-2">Auto-Generated Insights:</p>
                                    <div className="space-y-2">
                                        {reportData.recommendations.map((rec, i) => (
                                            <div key={i} className={`p-2 rounded text-xs ${
                                                rec.severity === 'HIGH' ? 'bg-red-50 text-red-700' :
                                                rec.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
                                                'bg-blue-50 text-blue-700'
                                            }`}>
                                                {rec.message}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 font-semibold"
                        >
                            {loading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <FileText className="w-5 h-5" />
                            )}
                            Preview Report
                        </button>
                        
                        {reportData && (
                            <button
                                onClick={handleDownloadPDF}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all disabled:opacity-50 font-semibold"
                            >
                                <Printer className="w-5 h-5" />
                                Print / Save PDF
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-slate-400 text-center mt-4">
                        💡 Tip: Use your browser's print dialog to save as PDF
                    </p>
                </div>
            </div>
        </div>
    );
}
