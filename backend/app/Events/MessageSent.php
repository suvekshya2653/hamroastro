<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;

class MessageSent implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message->load('user');
    }

    // 🔥 FIXED: Changed from PrivateChannel to public Channel
public function broadcastOn(): array
{
    // CORRECT: Uses the receiver's ID to define the private channel (e.g., 'chat.5')
    return [
        new PrivateChannel('chat.' . $this->message->receiver_id),
    ];
}
    public function broadcastAs()
    {
        return 'MessageSent';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->message->id,
            'text' => $this->message->text,
            'user_id' => $this->message->user_id,
            'sender_id' => $this->message->user_id,
            'receiver_id' => $this->message->receiver_id,
            'sender' => [
                'id' => $this->message->user->id,
                'name' => $this->message->user->name,
            ],
            'created_at' => $this->message->created_at->toDateTimeString(),
        ];
    }
}
