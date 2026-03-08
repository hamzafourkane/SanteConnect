<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\MeasurementController;
use App\Http\Controllers\API\DoctorController;
use App\Http\Controllers\API\ConsentController;
use App\Http\Controllers\API\RecommendationController;
use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\AlertController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\NotificationController;



Route::get('/', function () {
    return response()->json([
        'app' => 'HealthTrack5 API',
        'version' => '1.0.0',
        'laravel' => app()->version(),
        'status' => 'online',
        'endpoints' => [
            'auth' => '/api/register, /api/login',
            'measurements' => '/api/measurements',
            'consents' => '/api/consents',
            'doctor' => '/api/doctor/*',
            'admin' => '/api/admin/*',
        ]
    ]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    Route::get('/measurements', [MeasurementController::class, 'index']);
    Route::post('/measurements', [MeasurementController::class, 'store']);
    Route::get('/measurements/statistics', [MeasurementController::class, 'statistics']);
    
    Route::get('/alerts', [AlertController::class, 'index']);
    Route::get('/alerts/unread-count', [AlertController::class, 'unreadCount']);
    Route::post('/alerts/{id}/read', [AlertController::class, 'markAsRead']);
    Route::post('/alerts/read-all', [AlertController::class, 'markAllAsRead']);
    
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    
    Route::get('/reports/generate', [ReportController::class, 'generate']);
    Route::get('/reports/html', [ReportController::class, 'generateHtml']);
    
    Route::get('/recommendations', [RecommendationController::class, 'index']);
    
    Route::get('/consents', [ConsentController::class, 'index']);
    Route::post('/consents', [ConsentController::class, 'store']);
    Route::delete('/consents/{id}', [ConsentController::class, 'destroy']);
    Route::get('/doctors', [ConsentController::class, 'listDoctors']);
    
    Route::prefix('doctor')->group(function () {
        Route::get('/patients', [DoctorController::class, 'getAuthorizedPatients']);
        Route::get('/patients/{id}/data', [DoctorController::class, 'getPatientData']);
        Route::post('/patients/{id}/recommendation', [DoctorController::class, 'sendRecommendation']);
    });
    
    Route::prefix('admin')->group(function () {
        Route::get('/statistics', [AdminController::class, 'statistics']);
        Route::get('/doctors/pending', [AdminController::class, 'pendingDoctors']);
        Route::get('/doctors', [AdminController::class, 'allDoctors']);
        Route::post('/doctors/{id}/verify', [AdminController::class, 'verifyDoctor']);
        Route::post('/doctors/{id}/reject', [AdminController::class, 'rejectDoctor']);
        Route::get('/users', [AdminController::class, 'allUsers']);
        Route::get('/audit-logs', [AdminController::class, 'auditLogs']);
    });
    
});
