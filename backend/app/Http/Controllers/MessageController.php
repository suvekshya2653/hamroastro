<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use Illuminate\Support\Facades\Auth;
use App\Events\MessageSent;

class MessageController extends Controller
{
    // Get messages between current user and another user
    public function index(Request $request)
{
    $user = $request->user();

    if (!$user) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    // Get receiver_id from query params
    $receiverId = $request->query('receiver_id');

    if (!$receiverId) {
        return response()->json(['message' => 'receiver_id is required'], 400);
    }

    // Get all messages between these two users
    $messages = Message::where(function($query) use ($user, $receiverId) {
        $query->where('user_id', $user->id)
              ->where('receiver_id', $receiverId);
    })->orWhere(function($query) use ($user, $receiverId) {
        $query->where('user_id', $receiverId)
              ->where('receiver_id', $user->id);
    })
    ->orderBy('created_at', 'asc')
    ->get()
    ->map(function($message) {
        return [
            'id' => $message->id,
            'text' => $message->text,
            'user_id' => $message->user_id,  // ✅ Explicitly include sender ID
            'receiver_id' => $message->receiver_id,
            'created_at' => $message->created_at,
            'updated_at' => $message->updated_at,
            'sender_name' => $message->user->name ?? 'Unknown',  // Include sender name
        ];
    });

    return response()->json($messages);
}
   public function store(Request $request)
{
    $validated = $request->validate([
        'text' => 'required|string',
        'receiver_id' => 'required|exists:users,id',
    ]);

    $user = $request->user();

    // 🔥 FORCE CHECK: Make absolutely sure we have the right user
    if (!$user) {
        return response()->json(['error' => 'Unauthenticated'], 401);
    }

    $message = Message::create([
        'user_id' => $user->id,  // This MUST be the logged-in user's ID
        'receiver_id' => $validated['receiver_id'],
        'text' => $validated['text'],
    ]);

    $message->load('user:id,name');
    broadcast(new MessageSent($message))->toOthers();

    return response()->json([
        'id' => $message->id,
        'text' => $message->text,
        'user_id' => $message->user_id,
        'receiver_id' => $message->receiver_id,
        'created_at' => $message->created_at,
        'updated_at' => $message->updated_at,
        'sender_name' => $message->user->name ?? 'Unknown',
    ], 201);
}

    // Optional: Get list of users to chat with
    public function users(Request $request)
{
    $currentUser = $request->user();

    $users = \App\Models\User::where('id', '!=', $currentUser->id)
        ->select(
            'id',
            'name',
            'email',
            'dob_nep',
            'birth_time',
            'birth_place',
            'temp_address'
        )
        ->get();

    return response()->json($users);
}

}
