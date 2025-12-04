<?php

use Illuminate\Support\Facades\Broadcast;

/**
 * Authorization for the private chat channel
 * The rule is: A user can only subscribe to the channel that matches their own ID.
 * * @param \App\Models\User $user The authenticated user making the request.
 * @param int $userId The ID extracted from the channel name (e.g., in 'chat.5', $userId is 5).
 */
Broadcast::channel('chat.{userId}', function ($user, $userId) {
    // Allows any authenticated user ($user) to subscribe ONLY to the channel that matches their ID ($userId).
    return (int) $user->id === (int) $userId;
});

