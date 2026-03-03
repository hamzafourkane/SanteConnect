<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Carbon\Carbon;

class Measurement extends Model
{
    protected $connection = 'mongodb';
    
    protected $collection = 'measurements';

    const TYPE_TENSION = 'TENSION';      
    const TYPE_POIDS = 'POIDS';          
    const TYPE_SOMMEIL = 'SOMMEIL';      
    const TYPE_ACTIVITE = 'ACTIVITE';    

    protected $fillable = [
        'user_id',
        'type',
        'timestamp',
        'data',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'timestamp' => 'datetime',
            'user_id' => 'integer',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($measurement) {
            if (!isset($measurement->timestamp)) {
                $measurement->timestamp = Carbon::now();
            }
        });
    }

    public static function validateData(string $type, array $data): bool
    {
        switch ($type) {
            case self::TYPE_TENSION:
                return isset($data['systolique'], $data['diastolique']) &&
                       is_numeric($data['systolique']) &&
                       is_numeric($data['diastolique']) &&
                       $data['systolique'] > 0 &&
                       $data['diastolique'] > 0;
                
            case self::TYPE_POIDS:
                return isset($data['kg']) &&
                       is_numeric($data['kg']) &&
                       $data['kg'] > 0;
                
            case self::TYPE_SOMMEIL:
                return isset($data['hours']) &&
                       is_numeric($data['hours']) &&
                       $data['hours'] >= 0 &&
                       $data['hours'] <= 24;
                
            case self::TYPE_ACTIVITE:
                return (isset($data['steps']) && is_numeric($data['steps'])) ||
                       (isset($data['minutes']) && is_numeric($data['minutes']));
                
            default:
                return false;
        }
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();
        return $query->where('timestamp', '>=', $start)
                     ->where('timestamp', '<=', $end);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function getFormattedData(): array
    {
        switch ($this->type) {
            case self::TYPE_TENSION:
                return [
                    'systolic' => $this->data['systolique'] ?? null,
                    'diastolic' => $this->data['diastolique'] ?? null,
                    'unit' => 'mmHg',
                ];
                
            case self::TYPE_POIDS:
                return [
                    'value' => $this->data['kg'] ?? null,
                    'unit' => 'kg',
                ];
                
            case self::TYPE_SOMMEIL:
                return [
                    'value' => $this->data['hours'] ?? null,
                    'unit' => 'hours',
                ];
                
            case self::TYPE_ACTIVITE:
                return [
                    'steps' => $this->data['steps'] ?? null,
                    'minutes' => $this->data['minutes'] ?? null,
                ];
                
            default:
                return $this->data;
        }
    }
}
