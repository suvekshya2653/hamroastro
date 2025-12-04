<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Payment tracking fields
            $table->boolean('is_paid')->default(false)->after('text');
            $table->string('transaction_id')->nullable()->after('is_paid');
            $table->enum('payment_status', ['free', 'pending', 'paid'])->default('free')->after('transaction_id');
            $table->decimal('amount', 10, 2)->default(20.00)->after('payment_status');
            $table->timestamp('paid_at')->nullable()->after('amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn([
                'is_paid',
                'transaction_id',
                'payment_status',
                'amount',
                'paid_at'
            ]);
        });
    }
};
