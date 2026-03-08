<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Consent;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ConsentController extends Controller
{
    
    public function index(Request $request)
    {
        $user = $request->user();

        try {
            if ($user->isPatient()) {
                $consents = Consent::forPatient($user->id)
                                   ->with('doctor')
                                   ->get()
                                   ->map(function ($consent) {
                                       return [
                                           'id' => $consent->id,
                                           'doctor' => [
                                               'id' => $consent->doctor->id,
                                               'name' => $consent->doctor->name,
                                               'email' => $consent->doctor->email,
                                           ],
                                           'status' => $consent->status,
                                           'granted_at' => $consent->granted_at,
                                           'revoked_at' => $consent->revoked_at,
                                       ];
                                   });
            } else {
                $consents = Consent::forDoctor($user->id)
                                   ->with('patient')
                                   ->get()
                                   ->map(function ($consent) {
                                       return [
                                           'id' => $consent->id,
                                           'patient' => [
                                               'id' => $consent->patient->id,
                                               'name' => $consent->patient->name,
                                               'email' => $consent->patient->email,
                                           ],
                                           'status' => $consent->status,
                                           'granted_at' => $consent->granted_at,
                                           'revoked_at' => $consent->revoked_at,
                                       ];
                                   });
            }

            return response()->json([
                'success' => true,
                'count' => $consents->count(),
                'consents' => $consents,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch consents: ' . $e->getMessage()
            ], 500);
        }
    }

   
    public function store(Request $request)
    {
        $patient = $request->user();

        if (!$patient->isPatient()) {
            return response()->json([
                'success' => false,
                'message' => 'Only patients can grant consent.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'doctor_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $doctor = User::find($request->doctor_id);

            if (!$doctor || !$doctor->isDoctor()) {
                return response()->json([
                    'success' => false,
                    'message' => 'The specified user is not a doctor.'
                ], 422);
            }

            if (!$doctor->is_verified) {
                return response()->json([
                    'success' => false,
                    'message' => 'This doctor is not yet verified by the system.'
                ], 422);
            }

            $existingConsent = Consent::where('patient_id', $patient->id)
                                      ->where('doctor_id', $doctor->id)
                                      ->first();

            if ($existingConsent) {
                if ($existingConsent->isActive()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You have already granted consent to this doctor.'
                    ], 422);
                } else {
                    $existingConsent->grant();
                    
                    AuditLog::logEvent(AuditLog::EVENT_CONSENT_GRANTED, $patient->id, [
                        'doctor_id' => $doctor->id,
                        'action' => 'reactivated',
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Consent reactivated successfully.',
                        'consent' => [
                            'id' => $existingConsent->id,
                            'doctor' => [
                                'id' => $doctor->id,
                                'name' => $doctor->name,
                            ],
                            'status' => $existingConsent->status,
                            'granted_at' => $existingConsent->granted_at,
                        ],
                    ], 200);
                }
            }

            $consent = Consent::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'status' => Consent::STATUS_ACTIVE,
            ]);

            AuditLog::logEvent(AuditLog::EVENT_CONSENT_GRANTED, $patient->id, [
                'doctor_id' => $doctor->id,
                'consent_id' => $consent->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Consent granted successfully.',
                'consent' => [
                    'id' => $consent->id,
                    'doctor' => [
                        'id' => $doctor->id,
                        'name' => $doctor->name,
                        'email' => $doctor->email,
                    ],
                    'status' => $consent->status,
                    'granted_at' => $consent->granted_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to grant consent: ' . $e->getMessage()
            ], 500);
        }
    }

   
    public function destroy(Request $request, int $consentId)
    {
        $patient = $request->user();

        if (!$patient->isPatient()) {
            return response()->json([
                'success' => false,
                'message' => 'Only patients can revoke consent.'
            ], 403);
        }

        try {
            $consent = Consent::find($consentId);

            if (!$consent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Consent not found.'
                ], 404);
            }

            if ($consent->patient_id !== $patient->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only revoke your own consents.'
                ], 403);
            }

            if (!$consent->isActive()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This consent is already revoked.'
                ], 422);
            }

            $consent->revoke();

            AuditLog::logEvent(AuditLog::EVENT_CONSENT_REVOKED, $patient->id, [
                'doctor_id' => $consent->doctor_id,
                'consent_id' => $consent->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Consent revoked successfully.',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to revoke consent: ' . $e->getMessage()
            ], 500);
        }
    }

   
    public function listDoctors(Request $request)
    {
        try {
            $doctors = User::where('role', User::ROLE_MEDECIN)
                          ->where('is_verified', true)
                          ->select('id', 'name', 'email', 'created_at')
                          ->orderBy('name')
                          ->get();

            return response()->json([
                'success' => true,
                'count' => $doctors->count(),
                'doctors' => $doctors,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch doctors: ' . $e->getMessage()
            ], 500);
        }
    }
}
