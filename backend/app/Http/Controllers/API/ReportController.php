<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Measurement;
use App\Models\Alert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Carbon\Carbon;

class ReportController extends Controller
{
    
    public function generate(Request $request)
    {
        $user = auth()->user();
        
        try {
            $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subDays(30);
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

            $measurements = Measurement::where('user_id', $user->id)
                ->orderBy('timestamp', 'asc')
                ->get()
                ->filter(function ($m) use ($startDate, $endDate) {
                    $timestamp = Carbon::parse($m->timestamp);
                    return $timestamp->gte($startDate) && $timestamp->lte($endDate);
                });

            $statistics = $this->calculateStatistics($measurements);

            $alerts = collect([]);
            try {
                $alerts = Alert::where('user_id', $user->id)
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get();
            } catch (\Exception $e) {
            }

            $reportData = [
                'patient' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                ],
                'period' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => $endDate->format('Y-m-d'),
                ],
                'summary' => [
                    'total_measurements' => $measurements->count(),
                    'total_alerts' => $alerts->count(),
                    'critical_alerts' => $alerts->where('severity', 'CRITICAL')->count(),
                ],
                'statistics' => $statistics,
                'measurements' => $this->groupMeasurementsByType($measurements),
                'alerts' => $alerts->take(10)->toArray(),
                'recommendations' => $this->getHealthRecommendations($statistics),
            ];

            return response()->json([
                'success' => true,
                'report' => $reportData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate report: ' . $e->getMessage()
            ], 500);
        }
    }

    
    public function generateHtml(Request $request)
    {
        $user = auth()->user();
        
        try {
            $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subDays(30);
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

            $measurements = Measurement::where('user_id', $user->id)
                ->orderBy('timestamp', 'asc')
                ->get()
                ->filter(function ($m) use ($startDate, $endDate) {
                    $timestamp = Carbon::parse($m->timestamp);
                    return $timestamp->gte($startDate) && $timestamp->lte($endDate);
                });

            $statistics = $this->calculateStatistics($measurements);
            $groupedMeasurements = $this->groupMeasurementsByType($measurements);

            $html = $this->buildReportHtml($user, $startDate, $endDate, $statistics, $groupedMeasurements);

            return response($html)->header('Content-Type', 'text/html');
        } catch (\Exception $e) {
            return response('<html><body><h1>Error generating report</h1><p>' . $e->getMessage() . '</p></body></html>')
                ->header('Content-Type', 'text/html');
        }
    }

    
    private function calculateStatistics($measurements): array
    {
        $stats = [
            'TENSION' => ['count' => 0, 'avg_systolic' => 0, 'avg_diastolic' => 0, 'max_systolic' => 0, 'min_systolic' => 999],
            'POIDS' => ['count' => 0, 'avg' => 0, 'max' => 0, 'min' => 999, 'change' => 0],
            'SOMMEIL' => ['count' => 0, 'avg' => 0, 'total' => 0],
            'ACTIVITE' => ['count' => 0, 'avg_steps' => 0, 'total_steps' => 0, 'avg_minutes' => 0],
        ];

        $tensionSystolic = [];
        $tensionDiastolic = [];
        $weights = [];
        $sleepHours = [];
        $steps = [];
        $minutes = [];

        foreach ($measurements as $m) {
            switch ($m->type) {
                case 'TENSION':
                    $stats['TENSION']['count']++;
                    $tensionSystolic[] = $m->data['systolique'] ?? 0;
                    $tensionDiastolic[] = $m->data['diastolique'] ?? 0;
                    break;
                case 'POIDS':
                    $stats['POIDS']['count']++;
                    $weights[] = $m->data['kg'] ?? 0;
                    break;
                case 'SOMMEIL':
                    $stats['SOMMEIL']['count']++;
                    $sleepHours[] = $m->data['hours'] ?? 0;
                    break;
                case 'ACTIVITE':
                    $stats['ACTIVITE']['count']++;
                    $steps[] = $m->data['steps'] ?? 0;
                    $minutes[] = $m->data['minutes'] ?? 0;
                    break;
            }
        }

        if (count($tensionSystolic) > 0) {
            $stats['TENSION']['avg_systolic'] = round(array_sum($tensionSystolic) / count($tensionSystolic));
            $stats['TENSION']['avg_diastolic'] = round(array_sum($tensionDiastolic) / count($tensionDiastolic));
            $stats['TENSION']['max_systolic'] = max($tensionSystolic);
            $stats['TENSION']['min_systolic'] = min($tensionSystolic);
        }

        if (count($weights) > 0) {
            $stats['POIDS']['avg'] = round(array_sum($weights) / count($weights), 1);
            $stats['POIDS']['max'] = max($weights);
            $stats['POIDS']['min'] = min($weights);
            $stats['POIDS']['change'] = round(end($weights) - reset($weights), 1);
        }

        if (count($sleepHours) > 0) {
            $stats['SOMMEIL']['avg'] = round(array_sum($sleepHours) / count($sleepHours), 1);
            $stats['SOMMEIL']['total'] = round(array_sum($sleepHours), 1);
        }

        if (count($steps) > 0) {
            $stats['ACTIVITE']['avg_steps'] = round(array_sum($steps) / count($steps));
            $stats['ACTIVITE']['total_steps'] = array_sum($steps);
            $stats['ACTIVITE']['avg_minutes'] = round(array_sum($minutes) / count($minutes));
        }

        return $stats;
    }

    
    private function groupMeasurementsByType($measurements): array
    {
        $grouped = [
            'TENSION' => [],
            'POIDS' => [],
            'SOMMEIL' => [],
            'ACTIVITE' => [],
        ];

        foreach ($measurements as $m) {
            $grouped[$m->type][] = [
                'date' => $m->timestamp->format('Y-m-d H:i'),
                'data' => $m->data,
            ];
        }

        return $grouped;
    }

    
    private function getHealthRecommendations(array $stats): array
    {
        $recommendations = [];

        if ($stats['TENSION']['count'] > 0) {
            if ($stats['TENSION']['avg_systolic'] >= 140) {
                $recommendations[] = [
                    'type' => 'TENSION',
                    'severity' => 'HIGH',
                    'message' => 'Your average blood pressure is elevated. Consider reducing salt intake, exercising regularly, and consulting your doctor.'
                ];
            } elseif ($stats['TENSION']['avg_systolic'] >= 130) {
                $recommendations[] = [
                    'type' => 'TENSION',
                    'severity' => 'MEDIUM',
                    'message' => 'Your blood pressure is slightly elevated. Monitor it closely and maintain a healthy lifestyle.'
                ];
            }
        }

        if ($stats['SOMMEIL']['count'] > 0 && $stats['SOMMEIL']['avg'] < 7) {
            $recommendations[] = [
                'type' => 'SOMMEIL',
                'severity' => 'MEDIUM',
                'message' => 'Your average sleep duration is below recommended (7-9 hours). Try to improve your sleep schedule.'
            ];
        }

        if ($stats['ACTIVITE']['count'] > 0 && $stats['ACTIVITE']['avg_steps'] < 5000) {
            $recommendations[] = [
                'type' => 'ACTIVITE',
                'severity' => 'LOW',
                'message' => 'Your daily step count is low. Aim for at least 5,000-10,000 steps per day for better health.'
            ];
        }

        if ($stats['POIDS']['count'] > 0 && abs($stats['POIDS']['change']) > 2) {
            $direction = $stats['POIDS']['change'] > 0 ? 'gained' : 'lost';
            $recommendations[] = [
                'type' => 'POIDS',
                'severity' => 'MEDIUM',
                'message' => "You've {$direction} " . abs($stats['POIDS']['change']) . "kg during this period. Monitor your diet and exercise."
            ];
        }

        return $recommendations;
    }

   
    private function buildReportHtml($user, $startDate, $endDate, $statistics, $groupedMeasurements): string
    {
        $html = '<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Health Report - ' . $user->name . '</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
                .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { color: #3b82f6; margin: 0; }
                .header p { color: #666; margin: 5px 0; }
                .section { margin-bottom: 30px; }
                .section h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                .stat-card { background: #f8fafc; border-radius: 8px; padding: 15px; border-left: 4px solid #3b82f6; }
                .stat-card h3 { margin: 0 0 10px 0; color: #374151; }
                .stat-card .value { font-size: 24px; font-weight: bold; color: #3b82f6; }
                .stat-card .label { color: #6b7280; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
                th { background: #f1f5f9; color: #374151; }
                .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                .alert-high { color: #dc2626; }
                .alert-medium { color: #f59e0b; }
                .alert-low { color: #10b981; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏥 HealthTrack Medical Report</h1>
                <p><strong>Patient:</strong> ' . htmlspecialchars($user->name) . '</p>
                <p><strong>Period:</strong> ' . $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y') . '</p>
                <p><strong>Generated:</strong> ' . now()->format('F d, Y at H:i') . '</p>
            </div>

            <div class="section">
                <h2>📊 Summary Statistics</h2>
                <div class="stats-grid">';

        if ($statistics['TENSION']['count'] > 0) {
            $html .= '<div class="stat-card">
                <h3>🩺 Blood Pressure</h3>
                <div class="value">' . $statistics['TENSION']['avg_systolic'] . '/' . $statistics['TENSION']['avg_diastolic'] . ' <span class="label">mmHg avg</span></div>
                <p class="label">' . $statistics['TENSION']['count'] . ' measurements</p>
            </div>';
        }

        if ($statistics['POIDS']['count'] > 0) {
            $change = $statistics['POIDS']['change'];
            $changeStr = $change >= 0 ? "+{$change}" : "{$change}";
            $html .= '<div class="stat-card">
                <h3>⚖️ Weight</h3>
                <div class="value">' . $statistics['POIDS']['avg'] . ' <span class="label">kg avg</span></div>
                <p class="label">Change: ' . $changeStr . ' kg | ' . $statistics['POIDS']['count'] . ' measurements</p>
            </div>';
        }

        if ($statistics['SOMMEIL']['count'] > 0) {
            $html .= '<div class="stat-card">
                <h3>😴 Sleep</h3>
                <div class="value">' . $statistics['SOMMEIL']['avg'] . ' <span class="label">hours avg</span></div>
                <p class="label">' . $statistics['SOMMEIL']['count'] . ' nights tracked</p>
            </div>';
        }

        if ($statistics['ACTIVITE']['count'] > 0) {
            $html .= '<div class="stat-card">
                <h3>🏃 Activity</h3>
                <div class="value">' . number_format($statistics['ACTIVITE']['avg_steps']) . ' <span class="label">steps/day</span></div>
                <p class="label">Total: ' . number_format($statistics['ACTIVITE']['total_steps']) . ' steps | ' . $statistics['ACTIVITE']['count'] . ' days</p>
            </div>';
        }

        $html .= '</div></div>';

        foreach (['TENSION', 'POIDS', 'SOMMEIL', 'ACTIVITE'] as $type) {
            if (count($groupedMeasurements[$type]) > 0) {
                $labels = [
                    'TENSION' => '🩺 Blood Pressure History',
                    'POIDS' => '⚖️ Weight History',
                    'SOMMEIL' => '😴 Sleep History',
                    'ACTIVITE' => '🏃 Activity History'
                ];
                
                $html .= '<div class="section"><h2>' . $labels[$type] . '</h2><table><thead><tr><th>Date</th>';
                
                if ($type === 'TENSION') {
                    $html .= '<th>Systolic</th><th>Diastolic</th>';
                } elseif ($type === 'POIDS') {
                    $html .= '<th>Weight (kg)</th>';
                } elseif ($type === 'SOMMEIL') {
                    $html .= '<th>Hours</th><th>Quality</th>';
                } else {
                    $html .= '<th>Steps</th><th>Minutes</th>';
                }
                
                $html .= '</tr></thead><tbody>';

                foreach (array_slice($groupedMeasurements[$type], -10) as $m) {
                    $html .= '<tr><td>' . $m['date'] . '</td>';
                    
                    if ($type === 'TENSION') {
                        $html .= '<td>' . ($m['data']['systolique'] ?? '-') . ' mmHg</td>';
                        $html .= '<td>' . ($m['data']['diastolique'] ?? '-') . ' mmHg</td>';
                    } elseif ($type === 'POIDS') {
                        $html .= '<td>' . ($m['data']['kg'] ?? '-') . '</td>';
                    } elseif ($type === 'SOMMEIL') {
                        $html .= '<td>' . ($m['data']['hours'] ?? '-') . '</td>';
                        $html .= '<td>' . ($m['data']['quality'] ?? 'N/A') . '</td>';
                    } else {
                        $html .= '<td>' . number_format($m['data']['steps'] ?? 0) . '</td>';
                        $html .= '<td>' . ($m['data']['minutes'] ?? '-') . '</td>';
                    }
                    
                    $html .= '</tr>';
                }

                $html .= '</tbody></table></div>';
            }
        }

        $html .= '
            <div class="footer">
                <p>This report was generated by HealthTrack 5 - Connected Health Application</p>
                <p>For medical advice, please consult a qualified healthcare professional.</p>
            </div>
        </body>
        </html>';

        return $html;
    }
}
