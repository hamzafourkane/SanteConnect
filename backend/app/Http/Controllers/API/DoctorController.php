<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Consent;
use App\Models\Measurement;
use App\Models\Recommendation;
use App\Models\AuditLog;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class DoctorController extends Controller
{
   
    public function getAuthorizedPatients(Request $request)
    {
        $doctor = $request->user();

        if (!$doctor->isDoctor()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Only doctors can access this endpoint.'
            ], 403);
        }

        try {
            $consents = Consent::forDoctor($doctor->id)
                              ->active()
                              ->with('patient')
                              ->get();

            $patients = $consents->map(function ($consent) {
                return [
                    'id' => $consent->patient->id,
                    'name' => $consent->patient->name,
                    'email' => $consent->patient->email,
                    'consent_granted_at' => $consent->granted_at,
                    'consent_id' => $consent->id,
                ];
            });

            return response()->json([
                'success' => true,
                'count' => $patients->count(),
                'patients' => $patients,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch patients: ' . $e->getMessage()
            ], 500);
        }
    }

   
    public function getPatientData(Request $request, int $patientId)
    {
        $doctor = $request->user();

        if (!$doctor->isDoctor()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Only doctors can access this endpoint.'
            ], 403);
        }

        try {
            $hasConsent = Consent::existsBetween($patientId, $doctor->id);

            if (!$hasConsent) {
                AuditLog::logEvent(AuditLog::EVENT_ACCESS_PATIENT_DATA, $doctor->id, [
                    'patient_id' => $patientId,
                    'authorized' => false,
                    'reason' => 'No active consent',
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. No active consent from this patient.'
                ], 403);
            }

            $patient = User::find($patientId);

            if (!$patient || !$patient->isPatient()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Patient not found.'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'nullable|in:TENSION,POIDS,SOMMEIL,ACTIVITE',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'limit' => 'nullable|integer|min:1|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $cacheKey = "doctor_{$doctor->id}_patient_{$patientId}_data_" . md5(json_encode($request->all()));
            
            $measurementsData = Cache::remember($cacheKey, 300, function () use ($patientId, $request) {
                    $query = Measurement::forUser($patientId);

                    if ($request->has('type')) {
                        $query->ofType($request->type);
                    }

                    if ($request->has('start_date') && $request->has('end_date')) {
                        $query->betweenDates($request->start_date, $request->end_date);
                    }

                    $limit = $request->get('limit', 100);

                    return $query->orderBy('timestamp', 'desc')
                                ->limit($limit)
                                ->get()
                                ->map(function ($measurement) {
                                    return [
                                        'id' => $measurement->id,
                                        'type' => $measurement->type,
                                        'timestamp' => $measurement->timestamp,
                                        'data' => $measurement->data,
                                        'formatted_data' => $measurement->getFormattedData(),
                                    ];
                                });
                });

            $recommendations = Recommendation::forPatient($patientId)
                                            ->byDoctor($doctor->id)
                                            ->orderBy('created_at', 'desc')
                                            ->limit(20)
                                            ->get();

            AuditLog::logEvent(AuditLog::EVENT_ACCESS_PATIENT_DATA, $doctor->id, [
                'patient_id' => $patientId,
                'authorized' => true,
                'measurements_count' => count($measurementsData),
            ]);

            return response()->json([
                'success' => true,
                'patient' => [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                ],
                'measurements' => [
                    'count' => count($measurementsData),
                    'data' => $measurementsData,
                ],
                'recommendations' => [
                    'count' => $recommendations->count(),
                    'data' => $recommendations,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch patient data: ' . $e->getMessage()
            ], 500);
        }
    }


    public function sendRecommendation(Request $request, int $patientId)
    {
        $doctor = $request->user();

        if (!$doctor->isDoctor()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Only doctors can send recommendations.'
            ], 403);
        }

        $hasConsent = Consent::existsBetween($patientId, $doctor->id);

        if (!$hasConsent) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. No active consent from this patient.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required|string|min:10|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $recommendation = Recommendation::create([
                'patient_id' => $patientId,
                'doctor_id' => $doctor->id,
                'message' => $request->message,
            ]);

            Cache::forget('patient_' . $patientId . '_recommendations');

            Notification::createRecommendationNotification(
                $patientId,
                $doctor->name,
                (string) $recommendation->id
            );

            AuditLog::logEvent(AuditLog::EVENT_RECOMMENDATION_SENT, $doctor->id, [
                'patient_id' => $patientId,
                'recommendation_id' => $recommendation->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Recommendation sent successfully',
                'data' => [
                    'id' => $recommendation->id,
                    'patient_id' => $recommendation->patient_id,
                    'doctor_id' => $recommendation->doctor_id,
                    'message' => $recommendation->message,
                    'created_at' => $recommendation->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send recommendation: ' . $e->getMessage()
            ], 500);
        }
    }
}
