<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| These routes return Blade views or simple pages.
| DO NOT put API routes here.
|
*/

Route::get('/', function () {
    return view('welcome');
});

// If your React app is served from Laravel, you can optionally add:
Route::get('{any}', function () {
    return view('welcome');
})->where('any', '.*');
