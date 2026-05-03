<?php

use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PlatformOverviewController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\Route;

Route::get('/platform/overview', PlatformOverviewController::class);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{service}', [ServiceController::class, 'show']);
Route::get('/bookings', [BookingController::class, 'index']);
Route::post('/bookings', [BookingController::class, 'store']);
