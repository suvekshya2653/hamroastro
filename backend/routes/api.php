<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\ChatController;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES - Authentication
|--------------------------------------------------------------------------
*/
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| SYSTEM 1: Simple Customer Support Chat (ChatController)
| Purpose: Guest customers can send messages without login
| Used in: Simple contact/inquiry forms
|--------------------------------------------------------------------------
*/
Route::prefix('chat')->group(function () {
    // Public - Guest customer sends message
    Route::post('/send', [ChatController::class, 'customerSend']);

    // Public - Get chat history by conversation ID
    Route::get('/history/{id}', [ChatController::class, 'history']);

    // Protected - Admin only
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/admin/reply', [ChatController::class, 'adminReply']);
        Route::get('/customers', [ChatController::class, 'allCustomers']);
    });
});

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES - Require Authentication
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // 🔥 CRITICAL: Broadcasting authentication for Laravel Echo
    Broadcast::routes();

    // Auth endpoints
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', fn(Request $request) => $request->user());

    // User Profile
    Route::prefix('user')->group(function () {
        Route::get('profile', [UserProfileController::class, 'show']);
        Route::post('profile', [UserProfileController::class, 'store']);
    });

    /*
    |--------------------------------------------------------------------------
    | SYSTEM 2: Real-Time User-to-User Chat (MessageController)
    | Purpose: Authenticated customers chat with admin in real-time
    | Used in: CustomerChat.js (customer) + Messages.js (admin)
    | Features: Laravel Echo, WebSockets, Real-time updates
    |--------------------------------------------------------------------------
    */

    // Get messages between current user and another user
    Route::get('messages', [MessageController::class, 'index']);

    // ✅ ADD THIS NEW LINE:
    Route::get('check-payment', [MessageController::class, 'checkPaymentRequired']);

    // Send a message (both customer and admin use this)
    Route::post('messages', [MessageController::class, 'store']);

    // Get list of chat users with last messages (Admin dashboard)
    Route::get('chat-users', [MessageController::class, 'chatUsers']);

    // Get all users (optional - for starting new conversations)
    Route::get('users', [MessageController::class, 'allUsers']);

    // Mark messages as read (optional feature)
    Route::post('messages/mark-read', [MessageController::class, 'markAsRead']);

    /*
    |--------------------------------------------------------------------------
    | ADMIN-ONLY ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('admin')->group(function () {
        // Add any admin-specific endpoints here
    });

});
