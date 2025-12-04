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
        Schema::table('users', function (Blueprint $table) {
            // Temporary Address (break down into components)
            $table->string('temp_country')->nullable()->after('birth_place');
            $table->string('temp_city')->nullable()->after('temp_country');
            $table->string('temp_street')->nullable()->after('temp_city');

            // Permanent Address
            $table->string('perm_country')->nullable()->after('temp_address');
            $table->string('perm_city')->nullable()->after('perm_country');
            $table->string('perm_street')->nullable()->after('perm_city');
            $table->text('perm_address')->nullable()->after('perm_street'); // Full permanent address
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'temp_country',
                'temp_city',
                'temp_street',
                'perm_country',
                'perm_city',
                'perm_street',
                'perm_address'
            ]);
        });
    }
};
