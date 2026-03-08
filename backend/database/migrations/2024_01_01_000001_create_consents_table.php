<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('consents', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('patient_id')
                  ->constrained('users')
                  ->onDelete('cascade')
                  ->comment('Patient granting access');
            
            $table->foreignId('doctor_id')
                  ->constrained('users')
                  ->onDelete('cascade')
                  ->comment('Doctor receiving access');
            
            $table->enum('status', ['ACTIVE', 'REVOKED'])
                  ->default('ACTIVE')
                  ->comment('Consent status: ACTIVE allows access, REVOKED denies');
            
            $table->timestamp('granted_at')->useCurrent()
                  ->comment('When consent was initially granted');
            
            $table->timestamp('revoked_at')->nullable()
                  ->comment('When consent was revoked (if applicable)');
            
            $table->timestamps();
            
            $table->unique(['patient_id', 'doctor_id'], 'unique_patient_doctor_consent');
            
            $table->index(['doctor_id', 'status']);
            $table->index(['patient_id', 'doctor_id', 'status'], 'consent_lookup_index');
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('consents');
    }
};
