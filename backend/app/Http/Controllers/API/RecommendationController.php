<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Recommendation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RecommendationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->isPatient()) {
            return response()->json([
                'success' => false,
                'message' => 'Only patients can view recommendations.'
            ], 403);
        }

        try {
            $cacheKey = 'patient_' . $user->id . '_recommendations';

            $recommendations = Cache::remember($cacheKey, 300, function () use ($user) {
                    return Recommendation::forPatient($user->id)
                        ->orderBy('created_at', 'desc')
                        ->limit(50)
                        ->get()
                        ->map(function ($rec) {
                            $doctor = \App\Models\User::find($rec->doctor_id);
                            return [
                                'id' => $rec->id,
                                'doctor' => $doctor ? [
                                    'id' => $doctor->id,
                                    'name' => $doctor->name,
                                ] : null,
                                'message' => $rec->message,
                                'created_at' => $rec->created_at,
                            ];
                        });
                });

            return response()->json([
                'success' => true,
                'count' => $recommendations->count(),
                'recommendations' => $recommendations,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recommendations: ' . $e->getMessage()
            ], 500);
        }
    }
}
