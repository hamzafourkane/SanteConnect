<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Carbon\Carbon;

class AuditLog extends Model
{
    
    protected $connection = 'mongodb';
    
   
    protected $collection = 'audit_logs';

    const EVENT_LOGIN = 'LOGIN';
    const EVENT_LOGOUT = 'LOGOUT';
    const EVENT_REGISTER = 'REGISTER';
    const EVENT_ACCESS_PATIENT_DATA = 'ACCESS_PATIENT_DATA';
    const EVENT_CONSENT_GRANTED = 'CONSENT_GRANTED';
    const EVENT_CONSENT_REVOKED = 'CONSENT_REVOKED';
    const EVENT_MEASUREMENT_CREATED = 'MEASUREMENT_CREATED';
    const EVENT_RECOMMENDATION_SENT = 'RECOMMENDATION_SENT';

    protected $fillable = [
        'user_id',
        'event_type',
        'ip_address',
        'user_agent',
        'metadata',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($log) {
            if (!isset($log->created_at)) {
                $log->created_at = Carbon::now();
            }
        });
    }

    public static function logEvent(string $eventType, ?int $userId, array $metadata = []): self
    {
        return self::create([
            'user_id' => $userId,
            'event_type' => $eventType,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata,
        ]);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('event_type', $type);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
