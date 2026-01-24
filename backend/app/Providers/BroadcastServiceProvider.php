<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ✅ CRITICAL: Broadcasting routes need special handling
        // Use default middleware, Laravel will handle auth
        Broadcast::routes();

        require base_path('routes/channels.php');
    }
}
