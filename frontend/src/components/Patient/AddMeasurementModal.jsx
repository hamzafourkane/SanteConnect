import { useState } from 'react';
import { X, Activity } from 'lucide-react';
import { measurementsAPI } from '../../services/api';

const MEASUREMENT_TYPES = {
    TENSION: {
        label: 'Blood Pressure',
        icon: '🩺',
        fields: [
            { name: 'systolique', label: 'Systolic (mmHg)', type: 'number', placeholder: '120' },
            { name: 'diastolique', label: 'Diastolic (mmHg)', type: 'number', placeholder: '80' }
        ]
    },
    POIDS: {
        label: 'Weight',
        icon: '⚖️',
        fields: [
            { name: 'kg', label: 'Weight (kg)', type: 'number', placeholder: '70' }
        ]
    },
    SOMMEIL: {
        label: 'Sleep',
        icon: '😴',
        fields: [
            { name: 'hours', label: 'Hours of Sleep', type: 'number', placeholder: '8' }
        ]
    },
    ACTIVITE: {
        label: 'Activity',
        icon: '🏃',
        fields: [
            { name: 'steps', label: 'Steps', type: 'number', placeholder: '10000' },
            { name: 'minutes', label: 'Active Minutes', type: 'number', placeholder: '30' }
        ]
    }
};

export default function AddMeasurementModal({ isOpen, onClose, onSuccess }) {
    const [selectedType, setSelectedType] = useState('TENSION');
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleInputChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await measurementsAPI.create({
                type: selectedType,
                data: formData,
            });

            if (response.success) {
                onSuccess && onSuccess(response.data);
                onClose();
                setFormData({});
                setSelectedType('TENSION');
            }
        } catch (err) {
            setError(err.message || 'Failed to add measurement');
        } finally {
            setLoading(false);
        }
    };

    const currentType = MEASUREMENT_TYPES[selectedType];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="glass-card w-full max-w-md p-8 m-4 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Add Measurement</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="mb-6">
                    <label className="input-label">Measurement Type</label>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(MEASUREMENT_TYPES).map(([key, type]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setSelectedType(key);
                                    setFormData({});
                                }}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${selectedType === key
                                        ? 'border-primary-500 bg-primary-50 shadow-lg scale-105'
                                        : 'border-slate-200 bg-white hover:border-primary-300'
                                    }`}
                            >
                                <div className="text-2xl mb-1">{type.icon}</div>
                                <div className="text-sm font-semibold text-slate-700">{type.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <span className="text-lg">{currentType.icon}</span>
                            {currentType.label} Details
                        </h3>

                        {currentType.fields.map(field => (
                            <div key={field.name} className="mb-4 last:mb-0">
                                <label className="input-label">{field.label}</label>
                                <input
                                    type={field.type}
                                    min="0"
                                    step={field.type === 'number' ? '0.1' : undefined}
                                    placeholder={field.placeholder}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    className="input-field"
                                    required
                                />
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="p-4 bg-danger-50 border-2 border-danger-200 rounded-xl">
                            <p className="text-sm text-danger-700 font-medium">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </span>
                            ) : (
                                'Add Measurement'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
