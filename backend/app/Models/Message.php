<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $table = 'messages';

    protected $fillable = [
        'user_id',        // sender (client or admin)
        'receiver_id',    // receiver (admin or client)
        'text',
        'message_type',
        'conversation_id',
        'is_paid',
        'transaction_id',
        'payment_status',
        'amount',
        'paid_at',
    ];

    protected $casts = [
        'is_paid' => 'boolean',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id'); // sender
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id'); // receiver
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }
}
