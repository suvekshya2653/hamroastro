<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Events\MessageSent;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    /**
     * Get messages between current user and another user
     * Used by both Admin and Customer
     */
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

        Log::info("Fetching messages between User {$user->id} and User {$receiverId}");

        // Get all messages between these two users (bidirectional)
        $messages = Message::where(function($query) use ($user, $receiverId) {
            $query->where('user_id', $user->id)
                  ->where('receiver_id', $receiverId);
        })
        ->orWhere(function($query) use ($user, $receiverId) {
            $query->where('user_id', $receiverId)
                  ->where('receiver_id', $user->id);
        })
        ->with('user:id,name') // Eager load sender info
        ->orderBy('created_at', 'asc')
        ->get()
        ->map(function($message) {
    return [
        'id' => $message->id,
        'text' => $message->text,
        'user_id' => $message->user_id,
        'receiver_id' => $message->receiver_id,
        'is_paid' => $message->is_paid ?? false,           // ✅ NEW
        'payment_status' => $message->payment_status ?? 'free', // ✅ NEW
        'created_at' => $message->created_at->toISOString(),
        'updated_at' => $message->updated_at->toISOString(),
        'sender_name' => $message->user->name ?? 'Unknown',
    ];
});

        return response()->json($messages);
    }

    /**
     * Send a new message
     * Broadcasts to real-time channel
     */
    // public function store(Request $request)
    // {
    //     $validated = $request->validate([
    //         'text' => 'required|string|max:5000',
    //         'receiver_id' => 'required|exists:users,id',
    //     ]);

    //     $user = $request->user();

    //     if (!$user) {
    //         return response()->json(['error' => 'Unauthenticated'], 401);
    //     }

    //     Log::info("User {$user->id} sending message to User {$validated['receiver_id']}");

    //     // Create message
    //     $message = Message::create([
    //         'user_id' => $user->id,
    //         'receiver_id' => $validated['receiver_id'],
    //         'text' => $validated['text'],
    //     ]);

    //     // Load sender relationship
    //     $message->load('user:id,name');

    //     // Broadcast to real-time channel
    //     try {
    //         broadcast(new MessageSent($message))->toOthers();
    //         Log::info("Message {$message->id} broadcast successfully");
    //     } catch (\Exception $e) {
    //         Log::error("Broadcast failed: " . $e->getMessage());
    //     }

    //     // Return formatted response
    //     return response()->json([
    //         'id' => $message->id,
    //         'text' => $message->text,
    //         'user_id' => $message->user_id,
    //         'receiver_id' => $message->receiver_id,
    //         'created_at' => $message->created_at->toISOString(),
    //         'updated_at' => $message->updated_at->toISOString(),
    //         'sender_name' => $message->user->name ?? 'Unknown',
    //     ], 201);
    // }
    /**
 * Send a new message (with payment logic)
 */
public function store(Request $request)
{
    $validated = $request->validate([
        'text' => 'required|string|max:5000',
        'receiver_id' => 'required|exists:users,id',
        'transaction_id' => 'nullable|string', // ✅ NEW: For paid messages
    ]);

    $user = $request->user();

    if (!$user) {
        return response()->json(['error' => 'Unauthenticated'], 401);
    }

    Log::info("User {$user->id} sending message to User {$validated['receiver_id']}");

    // ✅ NEW: Check if payment is required (for customers only)
    $messageCount = Message::where('user_id', $user->id)
        ->where('receiver_id', $validated['receiver_id'])
        ->count();

    $requiresPayment = ($messageCount >= 1) && ($user->role === 'customer');

    // ✅ NEW: Payment validation for customers
    if ($requiresPayment) {
        if (empty($validated['transaction_id'])) {
            return response()->json([
                'error' => 'Payment required for this message',
                'requires_payment' => true,
                'amount' => 20.00
            ], 402); // 402 Payment Required
        }

        // Check if transaction ID is already used
        $existingTransaction = Message::where('transaction_id', $validated['transaction_id'])->first();

        if ($existingTransaction) {
            return response()->json([
                'error' => 'यो Transaction ID पहिले नै प्रयोग भइसकेको छ। कृपया फेरि प्रयास गर्नुहोस्।',
                'requires_payment' => true
            ], 400);
        }
    }

    // Create message with payment info
    $messageData = [
        'user_id' => $user->id,
        'receiver_id' => $validated['receiver_id'],
        'text' => $validated['text'],
        'is_paid' => $requiresPayment,
        'payment_status' => $requiresPayment ? 'pending' : 'free',
        'amount' => $requiresPayment ? 20.00 : 0,
        'transaction_id' => $validated['transaction_id'] ?? null,
        'paid_at' => $requiresPayment ? now() : null,
    ];

    $message = Message::create($messageData);

    // Load sender relationship
    $message->load('user:id,name');

    // ✅ Auto-approve payment after 3 minutes (simplified version)
    // In production, use a queue job for this
    if ($requiresPayment && $message->payment_status === 'pending') {
        // For now, auto-approve immediately for testing
        // TODO: Create a scheduled job to approve after 3 minutes
        $message->update(['payment_status' => 'paid']);
        Log::info("Message {$message->id} auto-approved (testing mode)");
    }

    // Broadcast to real-time channel
    try {
        broadcast(new MessageSent($message))->toOthers();
        Log::info("Message {$message->id} broadcast successfully");
    } catch (\Exception $e) {
        Log::error("Broadcast failed: " . $e->getMessage());
    }

    // Return formatted response
    return response()->json([
        'id' => $message->id,
        'text' => $message->text,
        'user_id' => $message->user_id,
        'receiver_id' => $message->receiver_id,
        'is_paid' => $message->is_paid,
        'payment_status' => $message->payment_status,
        'transaction_id' => $message->transaction_id,
        'created_at' => $message->created_at->toISOString(),
        'updated_at' => $message->updated_at->toISOString(),
        'sender_name' => $message->user->name ?? 'Unknown',
    ], 201);
}
//chatpay adding method










    /**
     * Get all chat users for admin dashboard
     * Returns list of ALL customers with their last message (if any)
     *
     * 🔧 FIXED: Now shows all customers, not just those with existing messages
     */
    public function chatUsers(Request $request)
    {
        $currentUser = $request->user();

        if (!$currentUser) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        Log::info("Fetching chat users for User {$currentUser->id}");

        // 🔥 KEY FIX: Get ALL customers (not just those with messages)
        $users = User::where('id', '!=', $currentUser->id)
            ->where('role', 'customer') // Only show customers, not other admins
            ->get()
            ->map(function($user) use ($currentUser) {
                // Get last message between current user and this customer
                $lastMessage = Message::where(function($query) use ($currentUser, $user) {
                    $query->where('user_id', $currentUser->id)
                          ->where('receiver_id', $user->id);
                })
                ->orWhere(function($query) use ($currentUser, $user) {
                    $query->where('user_id', $user->id)
                          ->where('receiver_id', $currentUser->id);
                })
                ->latest()
                ->first();

                // Count unread messages from this customer to admin
                $unreadCount = Message::where('user_id', $user->id)
                    ->where('receiver_id', $currentUser->id)
                    ->where('is_read', false)
                    ->count();

                return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,

                // Personal Information
                'gender' => $user->gender ?? null,
                'dob' => $user->dob ?? null,
                'dob_nep' => $user->dob_nep ?? null,
                'birth_time' => $user->birth_time ?? null,
                'birth_place' => $user->birth_place ?? null,
                'birth_city' => $user->birth_city ?? null,
                'birth_country' => $user->birth_country ?? null,

                // Temporary Address
                'temp_country' => $user->temp_country ?? null,
                'temp_city' => $user->temp_city ?? null,
                'temp_street' => $user->temp_street ?? null,
                'temp_address' => $user->temp_address ?? null,

                // Permanent Address
                'perm_country' => $user->perm_country ?? null,
                'perm_city' => $user->perm_city ?? null,
                'perm_street' => $user->perm_street ?? null,
                'perm_address' => $user->perm_address ?? null,


                'unread_count' => $unreadCount,
                'last_message' => $lastMessage ? [
                    'id' => $lastMessage->id,
                    'text' => $lastMessage->text,
                    'user_id' => $lastMessage->user_id,
                    'receiver_id' => $lastMessage->receiver_id,
                    'created_at' => $lastMessage->created_at->toISOString(),
                ] : null,
            ];
        })
            ->sortByDesc(function($user) {
                // Sort by last message time, customers without messages go to bottom
                return $user['last_message']['created_at'] ?? '1970-01-01';
            })
            ->values();

        Log::info("Returning {$users->count()} chat users");

        return response()->json($users);
    }

    /**
     * Get all users (for starting new conversations)
     * Optional: Used if you want to show all available users
     */
    public function allUsers(Request $request)
    {
        $currentUser = $request->user();

        if (!$currentUser) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $users = User::where('id', '!=', $currentUser->id)
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

    /**
     * Mark messages as read (optional feature)
     */
    public function markAsRead(Request $request)
    {
        $validated = $request->validate([
            'sender_id' => 'required|exists:users,id',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        // Mark all messages from sender to current user as read
        Message::where('user_id', $validated['sender_id'])
               ->where('receiver_id', $user->id)
               ->where('is_read', false)
               ->update(['is_read' => true]);

        return response()->json(['message' => 'Messages marked as read']);
    }








    /**
 * Check if customer needs to pay before sending message
 */
public function checkPaymentRequired(Request $request)
{
    $user = $request->user();
    $receiverId = $request->query('receiver_id');

    if (!$user || !$receiverId) {
        return response()->json(['error' => 'Invalid request'], 400);
    }

    // Count how many messages this customer has sent to this admin
    $messageCount = Message::where('user_id', $user->id)
        ->where('receiver_id', $receiverId)
        ->count();

    $requiresPayment = $messageCount >= 1; // First message free, 2nd onwards needs payment

    Log::info("User {$user->id} has sent {$messageCount} messages. Requires payment: " . ($requiresPayment ? 'YES' : 'NO'));

    return response()->json([
        'requires_payment' => $requiresPayment,
        'message_count' => $messageCount,
        'amount' => 20.00, // NPR 20 per message
    ]);
}
}
