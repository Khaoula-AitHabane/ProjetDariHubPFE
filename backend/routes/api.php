<?php

use App\Http\Controllers\Api\Admin\AdminAnnonceController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminReportController;
use App\Http\Controllers\Api\Admin\AdminStatisticsController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AiDescriptionController;
use App\Http\Controllers\Api\AiSmartSearchController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PlatformOverviewController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SmartSearchController;
use App\Http\Controllers\Api\SuggestionController;
use App\Http\Middleware\AiGenerationRateLimit;
use App\Http\Middleware\AuthenticateApiToken;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/platform/overview', PlatformOverviewController::class);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{service}', [ServiceController::class, 'show']);

// Old smart search
Route::post('/ai/smart-search', AiSmartSearchController::class);

// New Smart Search
Route::post('/search/smart', [SmartSearchController::class, 'search']);
Route::get('/search/suggestions', [SuggestionController::class, 'suggestions']);
Route::post('/bookings', [BookingController::class, 'store']);

Route::middleware(AuthenticateApiToken::class)->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/my/bookings', [BookingController::class, 'mine']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::prefix('ai')->middleware(AiGenerationRateLimit::class)->group(function (): void {
        Route::post('/generate-description', [AiDescriptionController::class, 'generate']);
        Route::post('/regenerate-description', [AiDescriptionController::class, 'regenerate']);
        Route::post('/moderate-ad', [\App\Http\Controllers\Api\AiModerationController::class, 'moderate']);
    });
    Route::get('/my/services', [ServiceController::class, 'mine']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::patch('/services/{service}', [ServiceController::class, 'update']);
    Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

    // === Espace admin ===
    Route::middleware(EnsureAdmin::class)->prefix('admin')->group(function (): void {
        Route::get('/dashboard', AdminDashboardController::class);
        Route::get('/statistics', AdminStatisticsController::class);

        Route::get('/annonces', [AdminAnnonceController::class, 'index']);
        Route::get('/annonces/pending', [AdminAnnonceController::class, 'pending']);
        Route::put('/annonces/{service}/accept', [AdminAnnonceController::class, 'accept']);
        Route::put('/annonces/{service}/refuse', [AdminAnnonceController::class, 'refuse']);
        Route::delete('/annonces/{service}', [AdminAnnonceController::class, 'destroy']);

        Route::get('/users', [AdminUserController::class, 'index']);
        Route::put('/users/{user}/block', [AdminUserController::class, 'block']);
        Route::put('/users/{user}/unblock', [AdminUserController::class, 'unblock']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);

        Route::get('/reports', [AdminReportController::class, 'index']);
        Route::put('/reports/{report}/ignore', [AdminReportController::class, 'ignore']);
        Route::delete('/reports/{report}', [AdminReportController::class, 'destroy']);

        // Legacy aliases kept for the existing app code until all callers move to the new admin module.
        Route::get('/listings', [AdminController::class, 'listings']);
        Route::post('/listings/{service}/approve', [AdminController::class, 'approve']);
        Route::post('/listings/{service}/reject', [AdminController::class, 'reject']);
        Route::delete('/listings/{service}', [AdminController::class, 'deleteListing']);
    });
});
