<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PlatformOverviewController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Middleware\AuthenticateApiToken;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/platform/overview', PlatformOverviewController::class);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{service}', [ServiceController::class, 'show']);
Route::post('/bookings', [BookingController::class, 'store']);

Route::middleware(AuthenticateApiToken::class)->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/my/bookings', [BookingController::class, 'mine']);
    Route::get('/my/services', [ServiceController::class, 'mine']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::patch('/services/{service}', [ServiceController::class, 'update']);
    Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

    // === Espace admin ===
    Route::middleware(EnsureAdmin::class)->prefix('admin')->group(function (): void {
        Route::get('/listings', [AdminController::class, 'listings']);
        Route::post('/listings/{service}/approve', [AdminController::class, 'approve']);
        Route::post('/listings/{service}/reject', [AdminController::class, 'reject']);
        Route::delete('/listings/{service}', [AdminController::class, 'deleteListing']);
        Route::get('/users', [AdminController::class, 'users']);
    });
});
