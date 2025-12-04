<?php

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'broadcasting/auth',
        '/login',
        '/register',
        '/logout',
        '/user',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4321',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
