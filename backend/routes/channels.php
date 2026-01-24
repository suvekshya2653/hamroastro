<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// ✅ Chat channel - For regular messages
Broadcast::channel('chat.{userId}', function ($user, $userId) {
    Log::info("🔐 Chat channel auth check", [
        'authenticated_user_id' => $user->id,
        'authenticated_user_role' => $user->role ?? 'customer',
        'requested_channel_userId' => $userId,
        'is_own_channel' => (int) $user->id === (int) $userId,
        'is_admin' => ($user->role ?? '') === 'admin'
    ]);

    // Allow if user owns channel OR is admin
    $allowed = (int) $user->id === (int) $userId || ($user->role ?? '') === 'admin';

    Log::info("🔐 Chat auth result: " . ($allowed ? "ALLOWED ✅" : "DENIED ❌"));

    return $allowed;
});

// ✅ Customer channel - For customer-specific updates
Broadcast::channel('customer.{userId}', function ($user, $userId) {
    Log::info("🔐 Customer channel auth check", [
        'authenticated_user_id' => $user->id,
        'authenticated_user_role' => $user->role ?? 'customer',
        'requested_userId' => $userId,
    ]);

    // Allow if user owns channel OR is admin
    $allowed = (int) $user->id === (int) $userId || ($user->role ?? '') === 'admin';

    Log::info("🔐 Customer auth result: " . ($allowed ? "ALLOWED ✅" : "DENIED ❌"));

    return $allowed;
});

// ✅ Admin channel - For admin-wide broadcasts
Broadcast::channel('admin', function ($user) {
    Log::info("🔐 Admin channel auth check", [
        'user_id' => $user->id,
        'role' => $user->role ?? 'customer',
    ]);

    // Allow if user is admin OR temporarily allow all for testing
    $allowed = ($user->role ?? '') === 'admin';

    // For testing, temporarily allow all:
    // $allowed = true;

    Log::info("🔐 Admin auth result: " . ($allowed ? "ALLOWED ✅" : "DENIED ❌"));

    return $allowed;
});
