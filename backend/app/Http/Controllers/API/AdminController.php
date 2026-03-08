<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\Measurement;
use App\Models\Consent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AdminController extends Controller
{
    public function statistics()
    {
        $user = auth()->user();
        
        if ($user->role !== 'ADMIN') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_patients' => User::where('role', 'PATIENT')->count(),
                'total_doctors' => User::where('role', 'MEDECIN')->count(),
                'pending_doctors' => User::where('role', 'MEDECIN')->where('is_verified', false)->count(),
                'verified_doctors' => User::where('role', 'MEDECIN')->where('is_verified', true)->count(),
                'total_measurements' => Measurement::count(),
                'total_consents' => Consent::where('status', 'ACTIVE')->count(),
            ]
        ]);
    }

    public function pendingDoctors()
    {
        $user = auth()->user();
        
        if ($user->role !== 'ADMIN') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $pendingDoctors = User::where('role', 'MEDECIN')
            ->where('is_verified', false)
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'profession_proof', 'created_at']);

        return response()->json([
            'success' => true,
            'doctors' => $pendingDoctors
        ]);
    }

    public function allDoctors()
    {
        $user = auth()->user();
        
        if ($user->role !== 'ADMIN') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $doctors = User::where('role', 'MEDECIN')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'profession_proof', 'is_verified', 'created_at']);

        return response()->json([
            'success' => true,
            'doctors' => $doctors
        ]);
    }

    public function verifyDoctor(Request $request, int $doctorId)
    {
        $admin = auth()->user();
        
        if ($admin->role !== 'ADMIN') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $doctor = User::where('id', $doctorId)
            ->where('role', 'MEDECIN')
            ->first();

        if (!$doctor) {
            return response()->json(['error' => 'Doctor not found'], 404);
        }

        $doctor->is_verified = true;
        $doctor->save();

        AuditLog::logEvent('DOCTOR_VERIFIED', $admin->id, [
            'doctor_id' => $doctorId,
            'doctor_email' => $doctor->email,
            'verified_by' => $admin->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Doctor verified successfully',
            'doctor' => $doctor
        ]);
    }

    public function rejectDoctor(Request $request, int $doctorId)
    {
        $admin = auth()->user();
        
        if ($admin->role !== 'ADMIN') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'reason' => 'nullable|string|max:500'
        ]);

        $doctor = User::where('id', $doctorId)
            ->where('role', 'MEDECIN')
            ->first();

        if (!$doctor) {
            return response()->json(['error' => 'Doctor not found'], 404);
        }

        AuditLog::logEvent('DOCTOR_REJECTED', $admin->id, [
            'doctor_id' => $doctorId,
            'doctor_email' => $doctor->email,
            'reason' => $request->reason ?? 'No reason provided',
            'rejected_by' => $admin->id
        ]);

        $doctor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Doctor rejected and removed'
        ]);
    }

    public function auditLogs(Request $request)
    {
        $admin = auth()->user();
        
        if ($admin->role !== 'ADMIN') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $limit = $request->get('limit', 50);
        
        $logs = AuditLog::orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'logs' => $logs
        ]);
    }

    public function allUsers()
    {
        $admin = auth()->user();
        
        if ($admin->role !== 'ADMIN') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $users = User::orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'role', 'is_verified', 'created_at']);

        return response()->json([
            'success' => true,
            'users' => $users
        ]);
    }
}
