<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Check if column already exists (in case migration was partially run)
        if (Schema::hasColumn('messages', 'message_type')) {
            echo "⚠️ Column 'message_type' already exists. Updating existing data...\n";
            DB::table('messages')->whereNull('message_type')->update(['message_type' => 'normal']);
            return;
        }

        // Step 1: Add column as nullable (allows existing records to have NULL temporarily)
        Schema::table('messages', function (Blueprint $table) {
            $table->string('message_type', 20)->nullable()->after('text');
        });

        // Step 2: Fill all existing records with 'normal'
        DB::table('messages')->update(['message_type' => 'normal']);

        // Step 3: Add validation triggers
        DB::statement("
            CREATE TRIGGER IF NOT EXISTS check_message_type_insert
            BEFORE INSERT ON messages
            FOR EACH ROW
            BEGIN
                SELECT CASE
                    WHEN NEW.message_type IS NULL THEN
                        RAISE(ABORT, 'message_type cannot be NULL')
                    WHEN NEW.message_type NOT IN ('normal', 'question', 'answer') THEN
                        RAISE(ABORT, 'Invalid message_type: must be normal, question, or answer')
                END;
            END;
        ");

        DB::statement("
            CREATE TRIGGER IF NOT EXISTS check_message_type_update
            BEFORE UPDATE ON messages
            FOR EACH ROW
            BEGIN
                SELECT CASE
                    WHEN NEW.message_type IS NULL THEN
                        RAISE(ABORT, 'message_type cannot be NULL')
                    WHEN NEW.message_type NOT IN ('normal', 'question', 'answer') THEN
                        RAISE(ABORT, 'Invalid message_type: must be normal, question, or answer')
                END;
            END;
        ");

        echo "✅ message_type column added and triggers created successfully\n";
    }

    public function down()
    {
        // Drop triggers first
        DB::statement("DROP TRIGGER IF EXISTS check_message_type_insert");
        DB::statement("DROP TRIGGER IF EXISTS check_message_type_update");

        // Then drop column
        if (Schema::hasColumn('messages', 'message_type')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->dropColumn('message_type');
            });
        }
    }
};
