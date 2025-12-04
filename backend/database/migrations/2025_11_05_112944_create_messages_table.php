<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');      // ✅ Changed from sender_id
            $table->unsignedBigInteger('receiver_id');
            $table->text('text')->nullable();            // ✅ Changed from message
            $table->boolean('is_read')->default(false);  // ✅ Added for read receipts
            $table->unsignedBigInteger('conversation_id')->nullable(); // ✅ For your model
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('receiver_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
