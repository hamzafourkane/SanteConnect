<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Notification extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'notifications';

    protected $fillable = [
        'user_id',
        'type',
        'title',
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

    const TYPE_RECOMMENDATION = 'RECOMMENDATION';
    const TYPE_CONSENT_GRANTED = 'CONSENT_GRANTED';
    const TYPE_CONSENT_REVOKED = 'CONSENT_REVOKED';
    const TYPE_DOCTOR_VERIFIED = 'DOCTOR_VERIFIED';
    const TYPE_ALERT = 'ALERT';

    
    public static function createRecommendationNotification(int $patientId, string $doctorName, string $recommendationId): self
    {
        return self::create([
            'user_id' => $patientId,
            'type' => self::TYPE_RECOMMENDATION,
            'title' => 'New Medical Recommendation',
            'message' => "Dr. {$doctorName} has sent you a new recommendation.",
            'data' => [
                'recommendation_id' => $recommendationId,
                'doctor_name' => $doctorName,
            ],
            'is_read' => false,
            'created_at' => now(),
        ]);
    }

   
    public static function createConsentGrantedNotification(int $doctorId, string $patientName): self
    {
        return self::create([
            'user_id' => $doctorId,
            'type' => self::TYPE_CONSENT_GRANTED,
            'title' => 'New Patient Access',
            'message' => "{$patientName} has granted you access to their health data.",
            'data' => ['patient_name' => $patientName],
            'is_read' => false,
            'created_at' => now(),
        ]);
    }

   
    public static function createDoctorVerifiedNotification(int $doctorId): self
    {
        return self::create([
            'user_id' => $doctorId,
            'type' => self::TYPE_DOCTOR_VERIFIED,
            'title' => 'Account Verified! ✅',
            'message' => 'Your medical credentials have been verified. You can now access patient data.',
            'data' => [],
            'is_read' => false,
            'created_at' => now(),
        ]);
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
