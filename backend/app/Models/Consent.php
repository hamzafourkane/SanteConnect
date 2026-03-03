<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consent extends Model
{
    use HasFactory;

    const STATUS_ACTIVE = 'ACTIVE';
    const STATUS_REVOKED = 'REVOKED';

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'status',
        'granted_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeForPatient($query, int $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    public function scopeForDoctor($query, int $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function revoke(): bool
    {
        $this->status = self::STATUS_REVOKED;
        $this->revoked_at = now();
        return $this->save();
    }

    public function grant(): bool
    {
        $this->status = self::STATUS_ACTIVE;
        $this->granted_at = now();
        $this->revoked_at = null;
        return $this->save();
    }

    public static function existsBetween(int $patientId, int $doctorId): bool
    {
        return self::where('patient_id', $patientId)
                  ->where('doctor_id', $doctorId)
                  ->where('status', self::STATUS_ACTIVE)
                  ->exists();
    }
}
