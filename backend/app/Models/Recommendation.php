<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Carbon\Carbon;

class Recommendation extends Model
{
    
    protected $connection = 'mongodb';
    
    
    protected $collection = 'recommendations';

    
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'message',
        'created_at',
    ];

    
    protected function casts(): array
    {
        return [
            'patient_id' => 'integer',
            'doctor_id' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($recommendation) {
            if (!isset($recommendation->created_at)) {
                $recommendation->created_at = Carbon::now();
            }
        });
    }

    
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    
    public function scopeForPatient($query, int $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    
    public function scopeByDoctor($query, int $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    
    public function scopeRecent($query, int $days = 30)
    {
        $startDate = Carbon::now()->subDays($days);
        return $query->where('created_at', '>=', $startDate);
    }
}
