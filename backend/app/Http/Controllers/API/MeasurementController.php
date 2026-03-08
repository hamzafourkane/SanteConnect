<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Measurement;
use App\Models\AuditLog;
use App\Models\Alert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class MeasurementController extends Controller
{
    
    public function store(Request $request)
    {
        $startTime = microtime(true); 
        
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:TENSION,POIDS,SOMMEIL,ACTIVITE',
            'data' => 'required|array',
            'timestamp' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if (!Measurement::validateData($request->type, $request->data)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid measurement data for type: ' . $request->type,
                'hint' => $this->getDataStructureHint($request->type),
            ], 422);
        }

        try {
            $measurement = Measurement::create([
                'user_id' => $request->user()->id,
                'type' => $request->type,
                'timestamp' => $request->timestamp ?? Carbon::now(),
                'data' => $request->data,
            ]);

            Cache::forget('user_' . $request->user()->id . '_statistics');

            AuditLog::logEvent(AuditLog::EVENT_MEASUREMENT_CREATED, $request->user()->id, [
                'type' => $measurement->type,
                'measurement_id' => $measurement->id,
            ]);

            $alert = Alert::checkAndCreate([
                'type' => $measurement->type,
                'data' => $measurement->data,
                '_id' => $measurement->id,
            ], $request->user()->id);

            $processingTime = microtime(true) - $startTime;

            return response()->json([
                'success' => true,
                'message' => 'Measurement stored successfully',
                'data' => [
                    'id' => $measurement->id,
                    'type' => $measurement->type,
                    'timestamp' => $measurement->timestamp,
                    'data' => $measurement->data,
                    'formatted_data' => $measurement->getFormattedData(),
                ],
                'alert' => $alert ? [
                    'type' => $alert->type,
                    'severity' => $alert->severity,
                    'message' => $alert->message,
                ] : null,
                'processing_time' => round($processingTime, 3) . 's',
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to store measurement: ' . $e->getMessage()
            ], 500);
        }
    }

    
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'nullable|in:TENSION,POIDS,SOMMEIL,ACTIVITE',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'limit' => 'nullable|integer|min:1|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $query = Measurement::forUser($request->user()->id);

            if ($request->has('type')) {
                $query->ofType($request->type);
            }

            if ($request->has('start_date') && $request->has('end_date')) {
                $query->betweenDates($request->start_date, $request->end_date);
            }

            $limit = $request->get('limit', 100);

            $measurements = $query->orderBy('timestamp', 'desc')
                                 ->limit($limit)
                                 ->get();

            $formattedData = $measurements->map(function ($measurement) {
                return [
                    'id' => $measurement->id,
                    'type' => $measurement->type,
                    'timestamp' => $measurement->timestamp,
                    'data' => $measurement->data,
                    'formatted_data' => $measurement->getFormattedData(),
                ];
            });

            return response()->json([
                'success' => true,
                'count' => $measurements->count(),
                'data' => $formattedData,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch measurements: ' . $e->getMessage()
            ], 500);
        }
    }

    
    public function statistics(Request $request)
    {
        $userId = $request->user()->id;
        $cacheKey = 'user_' . $userId . '_statistics';

        $statistics = Cache::remember($cacheKey, 300, function () use ($userId) {
                $stats = [];

                foreach ([Measurement::TYPE_TENSION, Measurement::TYPE_POIDS, Measurement::TYPE_SOMMEIL, Measurement::TYPE_ACTIVITE] as $type) {
                    $measurements = Measurement::forUser($userId)
                        ->ofType($type)
                        ->orderBy('timestamp', 'desc')
                        ->limit(30)
                        ->get();

                    $stats[$type] = [
                        'count' => $measurements->count(),
                        'latest' => $measurements->first() ? $measurements->first()->getFormattedData() : null,
                        'latest_timestamp' => $measurements->first() ? $measurements->first()->timestamp : null,
                    ];
                }

                return $stats;
            });

        return response()->json([
            'success' => true,
            'statistics' => $statistics,
            'cached' => Cache::has($cacheKey),
        ], 200);
    }

    
    private function getDataStructureHint(string $type): array
    {
        return match($type) {
            'TENSION' => ['systolique' => 'numeric', 'diastolique' => 'numeric'],
            'POIDS' => ['kg' => 'numeric'],
            'SOMMEIL' => ['hours' => 'numeric (0-24)'],
            'ACTIVITE' => ['steps' => 'numeric', 'minutes' => 'numeric'],
            default => [],
        };
    }
}
