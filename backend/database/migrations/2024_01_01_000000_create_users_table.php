<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email', 191)->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            
            $table->enum('role', ['PATIENT', 'MEDECIN'])
                  ->default('PATIENT')
                  ->comment('User role: PATIENT or MEDECIN (doctor)');
            
            $table->string('profession_proof')->nullable()
                  ->comment('Required for doctors - proof of medical profession');
            
            $table->boolean('is_verified')->default(false)
                  ->comment('Admin verification status for doctors');
            
            $table->rememberToken();
            $table->timestamps();
            
            $table->index('role');
            $table->index(['role', 'is_verified']);
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
