<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        // Validate incoming data
        $validator = Validator::make($request->all(), [
            "name" => "required|string|max:255",
            "email" => "required|email|unique:users,email",
            "password" => "required|min:6|confirmed",

            "dob_nep" => "required",
            "birth_time" => "required",
            "birth_place" => "required|string|max:255",

            "country" => "required|string",
            "city" => "required|string",
            "place" => "required|string",

            "temporary_address" => "required|string",
            "phone" => "required|string|max:20",
        ]);

        if ($validator->fails()) {
            return response()->json([
                "errors" => $validator->errors()
            ], 422);
        }

        // Create new user
        $user = User::create([
            "name" => $request->name,
            "email" => $request->email,
            "password" => Hash::make($request->password),
        ]);

        // Create user profile
        UserProfile::create([
            "user_id" => $user->id,
            "dob_nep" => $request->dob_nep,
            "birth_time" => $request->birth_time,
            "birth_place" => $request->birth_place,

            "country" => $request->country,
            "city" => $request->city,
            "place" => $request->place,
            "temporary_address" => $request->temporary_address,
            "phone" => $request->phone,
        ]);

        return response()->json([
            "message" => "Registration successful",
            "user" => $user
        ], 201);
    }
}
