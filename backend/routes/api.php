<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\ChatController;

// Public routes
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Public chat routes
Route::prefix('chat')->group(function () {
    Route::post('/send', [ChatController::class, 'customerSend']);
    Route::get('/history/{id}', [ChatController::class, 'history']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/admin/reply', [ChatController::class, 'adminReply']);
        Route::get('/customers', [ChatController::class, 'allCustomers']);
    });
});

// Protected routes - Require Authentication
Route::middleware('auth:sanctum')->group(function () {

    // 🔥 CRITICAL: Broadcasting auth route MUST be here
    Broadcast::routes();

    // Auth endpoints
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', fn(Request $request) => $request->user());

    // User Profile
    Route::prefix('user')->group(function () {
        Route::get('profile', [UserProfileController::class, 'show']);
        Route::post('profile', [UserProfileController::class, 'store']);
    });

    // Messages
    Route::get('messages', [MessageController::class, 'index']);
    Route::get('check-payment', [MessageController::class, 'checkPaymentRequired']);
    Route::post('messages', [MessageController::class, 'store']);
    Route::get('chat-users', [MessageController::class, 'chatUsers']);
    Route::get('users', [MessageController::class, 'allUsers']);
    Route::post('messages/mark-read', [MessageController::class, 'markAsRead']);

    // Admin-only routes
    Route::middleware('admin')->group(function () {
        // Add admin endpoints here
    });
});
