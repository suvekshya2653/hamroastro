<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
      'name',
        'email',
        'password',
        'role',

        // Personal Information
        'gender',
        'dob',
        'dob_nep',
        'birth_time',
        'birth_place',

        // Temporary Address
        'temp_country',
        'temp_city',
        'temp_street',
        'temp_address',

        // Permanent Address
        'perm_country',
        'perm_city',
        'perm_street',
        'perm_address',

    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];


    /*
    |--------------------------------------------------------------------------
    | PROFILE RELATION
    |--------------------------------------------------------------------------
    */
    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }


    /*
    |--------------------------------------------------------------------------
    | USER → CHAT MESSAGES
    |--------------------------------------------------------------------------
    */
    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'sender_id');
    }


    /*
    |--------------------------------------------------------------------------
    | USER → CONVERSATIONS (CUSTOMER ONLY)
    |--------------------------------------------------------------------------
    */
    public function conversations()
    {
        return $this->hasMany(Conversation::class, 'customer_id');
    }
}
