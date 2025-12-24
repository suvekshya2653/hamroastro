<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Message;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message->load('user:id,name'); // ✅ Load sender info
    }

    /**
     * ✅ CRITICAL: Broadcast to RECEIVER's channel, not sender's
     */
    public function broadcastOn()
    {
        // ✅ Send to the person RECEIVING the message
        return new PrivateChannel('chat.' . $this->message->receiver_id);
    }

    /**
     * Data sent to the frontend
     */
    public function broadcastWith()
    {
        return [
            'id' => $this->message->id,
            'text' => $this->message->text,
            'user_id' => $this->message->user_id,
            'receiver_id' => $this->message->receiver_id,
            'message_type' => $this->message->message_type ?? 'normal', // ✅ ADD THIS
            'is_paid' => $this->message->is_paid ?? false, // ✅ ADD THIS
            'payment_status' => $this->message->payment_status, // ✅ ADD THIS
            'transaction_id' => $this->message->transaction_id, // ✅ ADD THIS
            'amount' => $this->message->amount, // ✅ ADD THIS
            'created_at' => $this->message->created_at->toISOString(),
            'sender_name' => $this->message->user->name ?? 'Unknown', // ✅ ADD THIS
        ];
    }
}
