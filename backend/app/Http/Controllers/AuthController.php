<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // =======================
    // REGISTER
    // =======================
    public function register(Request $request)
    {
        $validatedData = $request->validate([
        'name'           => 'required|string|max:255',
        'email'          => 'required|email|unique:users,email',
        'password'       => 'required|min:6',
        'gender'         => 'required|string',
        'dob'            => 'nullable|date',
        'dob_nep'        => 'nullable|string',
        'birth_time'     => 'nullable|string',
        'birth_place'    => 'nullable|string',
        'birth_city'     => 'nullable|string',
        'birth_country'  => 'nullable|string',
        'temp_country'   => 'nullable|string',
        'temp_city'      => 'nullable|string',
        'temp_street'    => 'nullable|string',
        'temp_address'   => 'nullable|string',
        'perm_country'   => 'nullable|string',
        'perm_city'      => 'nullable|string',
        'perm_street'    => 'nullable|string',
        'perm_address'   => 'nullable|string',
        ]);

        $user = User::create([
               'name'           => $validatedData['name'],
        'email'          => $validatedData['email'],
        'password'       => Hash::make($validatedData['password']),
        'gender'         => $validatedData['gender'],
        'dob'            => $validatedData['dob'] ?? null,
        'dob_nep'        => $validatedData['dob_nep'] ?? null,
        'birth_time'     => $validatedData['birth_time'] ?? null,
        'birth_place'    => $validatedData['birth_place'] ?? null,
        'birth_city'     => $validatedData['birth_city'] ?? null,
        'birth_country'  => $validatedData['birth_country'] ?? null,
        'temp_country'   => $validatedData['temp_country'] ?? null,
        'temp_city'      => $validatedData['temp_city'] ?? null,
        'temp_street'    => $validatedData['temp_street'] ?? null,
        'temp_address'   => $validatedData['temp_address'] ?? null,
        'perm_country'   => $validatedData['perm_country'] ?? null,
        'perm_city'      => $validatedData['perm_city'] ?? null,
        'perm_street'    => $validatedData['perm_street'] ?? null,
        'perm_address'   => $validatedData['perm_address'] ?? null,
        'role'           => 'customer',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'token'   => $token,
            'user'    => $user,
        ]);
    }

    // =======================
    // LOGIN (Admin + Customer)
    // =======================
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required'
        ]);

        Log::info("Login attempt: " . $request->email);

        // -----------------------------------------
        // ⭐ HARDCODED ADMIN LOGIN
        // -----------------------------------------
        if (
            $request->email === 'sarita123@gmail.com' &&
            $request->password === 'iamsaritaghimira'
        ) {
            Log::info("Admin login detected");

            $admin = User::firstOrCreate(
                ['email' => 'sarita123@gmail.com'],
                [
                    'name' => 'Sarita Ghimira',
                    'password' => Hash::make('iamsaritaghimira'),
                    'gender' => 'female',
                    'role' => 'admin',
                ]
            );

            // Force admin role
            if ($admin->role !== 'admin') {
                $admin->update(['role' => 'admin']);
            }

            $token = $admin->createToken('admin_token')->plainTextToken;

            return response()->json([
                'message' => 'Admin login successful',
                'token'   => $token,
                'user'    => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'gender' => $admin->gender,
                    'role' => 'admin',   // ← FIX
                ],
            ], 200);
        }

        // -----------------------------------------
        // 🔹 NORMAL CUSTOMER LOGIN
        // -----------------------------------------
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            Log::warning("Login failed for: " . $request->email);
            return response()->json(['message' => 'Invalid login credentials'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'gender' => $user->gender,
                'role' => $user->role ?? 'customer',   // ← FIX
            ],
        ]);
    }

    // =======================
    // LOGOUT
    // =======================
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
