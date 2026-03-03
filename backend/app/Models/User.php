<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    const ROLE_PATIENT = 'PATIENT';
    const ROLE_MEDECIN = 'MEDECIN';
    const ROLE_ADMIN = 'ADMIN';

   
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'profession_proof',
        'is_verified',
    ];

    
    protected $hidden = [
        'password',
        'remember_token',
    ];

    
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_verified' => 'boolean',
        ];
    }

    
    public function isPatient(): bool
    {
        return $this->role === self::ROLE_PATIENT;
    }

   
    public function isDoctor(): bool
    {
        return $this->role === self::ROLE_MEDECIN;
    }

   
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    
    public function isVerifiedDoctor(): bool
    {
        return $this->isDoctor() && $this->is_verified;
    }

    
    public function consentsAsPatient()
    {
        return $this->hasMany(Consent::class, 'patient_id');
    }

   
    public function consentsAsDoctor()
    {
        return $this->hasMany(Consent::class, 'doctor_id');
    }

    public function authorizedDoctors()
    {
        return $this->belongsToMany(User::class, 'consents', 'patient_id', 'doctor_id')
                    ->wherePivot('status', Consent::STATUS_ACTIVE);
    }

    
    public function authorizedPatients()
    {
        return $this->belongsToMany(User::class, 'consents', 'doctor_id', 'patient_id')
                    ->wherePivot('status', Consent::STATUS_ACTIVE);
    }

    public function hasAccessToPatient(int $patientId): bool
    {
        if (!$this->isDoctor()) {
            return false;
        }

        return Consent::where('doctor_id', $this->id)
                     ->where('patient_id', $patientId)
                     ->where('status', Consent::STATUS_ACTIVE)
                     ->exists();
    }
}
