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

        // ✅ FIX: Accept BOTH receiver_id AND user_id for compatibility
        $otherUserId = $request->query('receiver_id') ?? $request->query('user_id');

        if (!$otherUserId) {
            return response()->json(['message' => 'user_id or receiver_id is required'], 400);
        }

        Log::info("Fetching messages between User {$user->id} and User {$otherUserId}");

        // Get all messages between these two users (bidirectional)
        $messages = Message::where(function($query) use ($user, $otherUserId) {
            $query->where('user_id', $user->id)
                  ->where('receiver_id', $otherUserId);
        })
        ->orWhere(function($query) use ($user, $otherUserId) {
            $query->where('user_id', $otherUserId)
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
                'message_type' => $message->message_type ?? 'normal',
                'is_paid' => $message->is_paid ?? false,
                'payment_status' => $message->payment_status,
                'created_at' => $message->created_at->toISOString(),
                'updated_at' => $message->updated_at->toISOString(),
                'sender_name' => $message->user->name ?? 'Unknown',
            ];
        });

        return response()->json($messages);
    }








    /**
 * Send a new message (with payment logic)
 * ✅ FIXED: Admin never pays, customers only pay for "question" type
 */
public function store(Request $request)
{
    $validated = $request->validate([
        'text' => 'required|string|max:5000',
        'receiver_id' => 'required|exists:users,id',
        'transaction_id' => 'nullable|string',
        'message_type' => 'required|in:normal,question,answer',
    ]);

    $user = $request->user();

    if (!$user) {
        return response()->json(['error' => 'Unauthenticated'], 401);
    }

    $messageType = $validated['message_type'];

    Log::info("User {$user->id} ({$user->role}) sending {$messageType} message to User {$validated['receiver_id']}");

    // ✅ FIXED: Initialize with default values
    $requiresPayment = false;
    $isPaid = false;
    $paymentStatus = 'free';  // ✅ Default is 'free'
    $amount = 0;

    // 🔥 ONLY "question" type from CUSTOMERS requires payment
    // ✅ Admin NEVER pays for anything
    if ($messageType === 'question' && $user->role !== 'admin') {
        $requiresPayment = true;

        // Check if transaction ID was provided
        if (!empty($validated['transaction_id'])) {
            // Payment was made
            $isPaid = true;
            $paymentStatus = 'paid';
            $amount = 20.00;

            // Verify transaction ID is not already used
            $existingTransaction = Message::where('transaction_id', $validated['transaction_id'])->first();

            if ($existingTransaction) {
                Log::warning("Transaction ID already used: {$validated['transaction_id']}");
                return response()->json([
                    'error' => 'यो Transaction ID पहिले नै प्रयोग भइसकेको छ। कृपया फेरि प्रयास गर्नुहोस्।',
                    'requires_payment' => true
                ], 400);
            }
        } else {
            // ✅ FIXED: Payment required but not provided
            $isPaid = false;  // ✅ Changed from true to false
            $paymentStatus = 'pending';
            $amount = 20.00;

            Log::warning("Question requires payment but no transaction_id provided");
            return response()->json([
                'error' => 'Payment required for questions',
                'requires_payment' => true,
                'amount' => 20.00
            ], 402); // 402 Payment Required
        }
    }

    Log::info("Payment Status - Required: " . ($requiresPayment ? 'YES' : 'NO') .
              " | Paid: " . ($isPaid ? 'YES' : 'NO') .
              " | Status: {$paymentStatus} | Type: {$messageType}");

    // Create message with payment info
    $messageData = [
        'user_id' => $user->id,
        'receiver_id' => $validated['receiver_id'],
        'text' => $validated['text'],
        'message_type' => $messageType,
        'is_paid' => $isPaid,
        'payment_status' => $paymentStatus,
        'amount' => $amount,
        'transaction_id' => $validated['transaction_id'] ?? null,
        'paid_at' => ($isPaid && $paymentStatus === 'paid') ? now() : null,
    ];

    $message = Message::create($messageData);

    // Load sender relationship
    $message->load('user:id,name');

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
        'message_type' => $message->message_type,
        'is_paid' => $message->is_paid,
        'payment_status' => $message->payment_status,
        'transaction_id' => $message->transaction_id,
        'amount' => $message->amount,
        'created_at' => $message->created_at->toISOString(),
        'updated_at' => $message->updated_at->toISOString(),
        'sender_name' => $message->user->name ?? 'Unknown',
    ], 201);
}











    /**
     * Get all chat users for admin dashboard
     * Returns list of ALL customers with their last message (if any)
     */
    public function chatUsers(Request $request)
    {
        $currentUser = $request->user();

        if (!$currentUser) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        Log::info("Fetching chat users for User {$currentUser->id}");

        // Get ALL customers (not just those with messages)
        $users = User::where('id', '!=', $currentUser->id)
            ->where('role', 'customer') // Only show customers
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
     * Mark messages as read
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
     * ✅ FIXED: Based on message_type, not message count
     */
    public function checkPayment(Request $request)
    {
        $user = $request->user();
        $receiverId = $request->query('receiver_id');
        $messageType = $request->query('message_type', 'normal');

        if (!$user || !$receiverId) {
            return response()->json(['error' => 'Invalid request'], 400);
        }

        // ✅ Admin never needs to pay
        if ($user->role === 'admin') {
            Log::info("Admin user {$user->id} - no payment required");
            return response()->json([
                'requires_payment' => false,
                'message_type' => $messageType,
                'amount' => 0,
            ]);
        }

        // ✅ Only "question" type requires payment
        $requiresPayment = ($messageType === 'question');

        Log::info("User {$user->id} message type: {$messageType}. Requires payment: " . ($requiresPayment ? 'YES' : 'NO'));

        return response()->json([
            'requires_payment' => $requiresPayment,
            'message_type' => $messageType,
            'amount' => $requiresPayment ? 20.00 : 0,
        ]);
    }
}
