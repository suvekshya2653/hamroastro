<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MessageController;
use App\Models\User;
use App\Http\Controllers\UserProfileController;

// Public routes
Route::post('register', [AuthController::class, 'register'])->name('register');
Route::post('login', [AuthController::class, 'login'])->name('login');


Route::get('chat-users', function () {
    return User::select('id', 'name', 'email', 'dob_nep', 'birth_time', 'city', 'country', 'street', 'gender')->get();
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', function (Request $request) {
        return $request->user();
    });

    // Profile routes
    Route::get('user/profile', [UserProfileController::class, 'show']);
    Route::post('user/profile', [UserProfileController::class, 'store']);

    // Messages
    Route::get('messages', [MessageController::class, 'index']);
    Route::post('messages', [MessageController::class, 'store']);
});
