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

// ✅ Chat channel - Allow user to access their own channel OR admin to access any
Broadcast::channel('chat.{userId}', function ($user, $userId) {
    Log::info("🔐 Broadcasting auth check", [
        'authenticated_user_id' => $user->id,
        'authenticated_user_role' => $user->role ?? 'customer',
        'requested_channel_userId' => $userId,
        'is_own_channel' => (int) $user->id === (int) $userId,
        'is_admin' => ($user->role ?? '') === 'admin'
    ]);

    // Allow if:
    // 1. User is accessing their own channel, OR
    // 2. User is admin (can access any channel)
    $allowed = (int) $user->id === (int) $userId || ($user->role ?? '') === 'admin';

    Log::info("🔐 Auth result: " . ($allowed ? "ALLOWED ✅" : "DENIED ❌"));

    return $allowed;
});
