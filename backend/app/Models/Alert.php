<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Alert extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'alerts';

    protected $fillable = [
        'user_id',
        'measurement_id',
        'type',          
        'severity',      
        'message',
        'data',
        'is_read',
        'created_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'data' => 'array',
        'is_read' => 'boolean',
        'created_at' => 'datetime',
    ];

    const TYPE_TENSION_HIGH = 'TENSION_HIGH';
    const TYPE_TENSION_LOW = 'TENSION_LOW';
    const TYPE_WEIGHT_GAIN = 'WEIGHT_GAIN';
    const TYPE_WEIGHT_LOSS = 'WEIGHT_LOSS';
    const TYPE_SLEEP_LOW = 'SLEEP_LOW';
    const TYPE_ACTIVITY_LOW = 'ACTIVITY_LOW';

    const SEVERITY_LOW = 'LOW';
    const SEVERITY_MEDIUM = 'MEDIUM';
    const SEVERITY_HIGH = 'HIGH';
    const SEVERITY_CRITICAL = 'CRITICAL';

    const THRESHOLDS = [
        'TENSION' => [
            'systolic_high' => 140,     
            'systolic_critical' => 180, 
            'systolic_low' => 90,       
            'diastolic_high' => 90,
            'diastolic_critical' => 120,
            'diastolic_low' => 60,
        ],
        'SOMMEIL' => [
            'min_hours' => 5,           
        ],
        'ACTIVITE' => [
            'min_steps' => 3000,        
        ],
        'POIDS' => [
            'weekly_change_percent' => 3, 
        ]
    ];

    
    public static function checkAndCreate(array $measurement, int $userId): ?self
    {
        $type = $measurement['type'];
        $data = $measurement['data'];
        $alert = null;

        switch ($type) {
            case 'TENSION':
                $alert = self::checkBloodPressure($data, $userId, $measurement['_id'] ?? null);
                break;
            case 'SOMMEIL':
                $alert = self::checkSleep($data, $userId, $measurement['_id'] ?? null);
                break;
            case 'ACTIVITE':
                $alert = self::checkActivity($data, $userId, $measurement['_id'] ?? null);
                break;
            case 'POIDS':
                $alert = self::checkWeight($data, $userId, $measurement['_id'] ?? null);
                break;
        }

        return $alert;
    }

    
    private static function checkBloodPressure(array $data, int $userId, $measurementId): ?self
    {
        $systolic = $data['systolique'] ?? 0;
        $diastolic = $data['diastolique'] ?? 0;
        $thresholds = self::THRESHOLDS['TENSION'];

        if ($systolic >= $thresholds['systolic_critical'] || $diastolic >= $thresholds['diastolic_critical']) {
            return self::create([
                'user_id' => $userId,
                'measurement_id' => (string) $measurementId,
                'type' => self::TYPE_TENSION_HIGH,
                'severity' => self::SEVERITY_CRITICAL,
                'message' => "⚠️ CRITICAL: Blood pressure is dangerously high ({$systolic}/{$diastolic} mmHg). Seek immediate medical attention!",
                'data' => ['systolic' => $systolic, 'diastolic' => $diastolic],
                'is_read' => false,
                'created_at' => now(),
            ]);
        }

        if ($systolic >= $thresholds['systolic_high'] || $diastolic >= $thresholds['diastolic_high']) {
            return self::create([
                'user_id' => $userId,
                'measurement_id' => (string) $measurementId,
                'type' => self::TYPE_TENSION_HIGH,
                'severity' => self::SEVERITY_HIGH,
                'message' => "🔴 High blood pressure detected ({$systolic}/{$diastolic} mmHg). Consider consulting your doctor.",
                'data' => ['systolic' => $systolic, 'diastolic' => $diastolic],
                'is_read' => false,
                'created_at' => now(),
            ]);
        }

        if ($systolic <= $thresholds['systolic_low'] || $diastolic <= $thresholds['diastolic_low']) {
            return self::create([
                'user_id' => $userId,
                'measurement_id' => (string) $measurementId,
                'type' => self::TYPE_TENSION_LOW,
                'severity' => self::SEVERITY_MEDIUM,
                'message' => "🟡 Low blood pressure detected ({$systolic}/{$diastolic} mmHg). Monitor for dizziness or fatigue.",
                'data' => ['systolic' => $systolic, 'diastolic' => $diastolic],
                'is_read' => false,
                'created_at' => now(),
            ]);
        }

        return null;
    }

   
    private static function checkSleep(array $data, int $userId, $measurementId): ?self
    {
        $hours = $data['hours'] ?? 0;
        $threshold = self::THRESHOLDS['SOMMEIL']['min_hours'];

        if ($hours < $threshold) {
            return self::create([
                'user_id' => $userId,
                'measurement_id' => (string) $measurementId,
                'type' => self::TYPE_SLEEP_LOW,
                'severity' => $hours < 4 ? self::SEVERITY_HIGH : self::SEVERITY_MEDIUM,
                'message' => "😴 Low sleep detected ({$hours} hours). Adults need 7-9 hours for optimal health.",
                'data' => ['hours' => $hours],
                'is_read' => false,
                'created_at' => now(),
            ]);
        }

        return null;
    }

   
    private static function checkActivity(array $data, int $userId, $measurementId): ?self
    {
        $steps = $data['steps'] ?? 0;
        $threshold = self::THRESHOLDS['ACTIVITE']['min_steps'];

        if ($steps < $threshold) {
            return self::create([
                'user_id' => $userId,
                'measurement_id' => (string) $measurementId,
                'type' => self::TYPE_ACTIVITY_LOW,
                'severity' => self::SEVERITY_LOW,
                'message' => "🚶 Low activity today ({$steps} steps). Try to reach at least 5,000-10,000 steps daily.",
                'data' => ['steps' => $steps],
                'is_read' => false,
                'created_at' => now(),
            ]);
        }

        return null;
    }

   
    private static function checkWeight(array $data, int $userId, $measurementId): ?self
    {
        $currentWeight = $data['kg'] ?? 0;
        
        $lastWeekMeasurement = Measurement::where('user_id', $userId)
            ->where('type', 'POIDS')
            ->where('timestamp', '>=', now()->subDays(7))
            ->where('timestamp', '<', now()->subDay())
            ->orderBy('timestamp', 'desc')
            ->first();

        if ($lastWeekMeasurement) {
            $previousWeight = $lastWeekMeasurement->data['kg'] ?? 0;
            if ($previousWeight > 0) {
                $changePercent = abs(($currentWeight - $previousWeight) / $previousWeight) * 100;
                
                if ($changePercent >= self::THRESHOLDS['POIDS']['weekly_change_percent']) {
                    $direction = $currentWeight > $previousWeight ? 'gain' : 'loss';
                    $type = $currentWeight > $previousWeight ? self::TYPE_WEIGHT_GAIN : self::TYPE_WEIGHT_LOSS;
                    $changePercentRounded = round($changePercent, 1);
                    
                    return self::create([
                        'user_id' => $userId,
                        'measurement_id' => (string) $measurementId,
                        'type' => $type,
                        'severity' => self::SEVERITY_MEDIUM,
                        'message' => "⚖️ Significant weight {$direction} detected ({$changePercentRounded}% change). Current: {$currentWeight}kg, Previous: {$previousWeight}kg",
                        'data' => [
                            'current' => $currentWeight,
                            'previous' => $previousWeight,
                            'change_percent' => round($changePercent, 1)
                        ],
                        'is_read' => false,
                        'created_at' => now(),
                    ]);
                }
            }
        }

        return null;
    }

   
    public function scopeUnreadForUser($query, int $userId)
    {
        return $query->where('user_id', $userId)
            ->where('is_read', false)
            ->orderBy('created_at', 'desc');
    }

    
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId)
            ->orderBy('created_at', 'desc');
    }
}
