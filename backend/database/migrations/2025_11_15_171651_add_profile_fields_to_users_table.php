<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('dob_nep')->nullable()->after('email');
            $table->string('birth_time')->nullable()->after('dob_nep');
            $table->string('birth_place')->nullable()->after('birth_time');
            $table->string('temp_address')->nullable()->after('birth_place');
            $table->string('phone')->nullable()->after('temp_address');
            $table->string('photo')->nullable()->after('phone');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['dob_nep', 'birth_time', 'birth_place', 'temp_address', 'phone', 'photo']);
        });
    }
};
