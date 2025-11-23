<?php

namespace App\Http\Controllers;

use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserProfileController extends Controller
{
    /**
     * Get the authenticated user's profile
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Get or create profile
        $profile = $user->profile;

        if (!$profile) {
            // Auto-create profile with user's registration data
            $profile = UserProfile::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);
        }

        return response()->json([
            'name' => $profile->name ?? $user->name,
            'email' => $user->email,
            'dob_nep' => $profile->dob_nep,
            'birth_time' => $profile->birth_time,
            'birth_place' => $profile->birth_place,
            'temp_address' => $profile->temp_address,
            'phone' => $profile->phone,
            'photo_url' => $profile->photo ? url('storage/' . $profile->photo) : null,
        ]);
    }

    /**
     * Create or update the authenticated user's profile
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'dob_nep' => 'nullable|string|max:50',
            'birth_time' => 'nullable|string|max:50',
            'birth_place' => 'nullable|string|max:255',
            'temp_address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
            'email' => 'sometimes|email|max:255',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Get or create profile
        $profile = $user->profile;

        if (!$profile) {
            $profile = new UserProfile(['user_id' => $user->id]);
        }

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($profile->photo) {
                Storage::disk('public')->delete($profile->photo);
            }

            $path = $request->file('photo')->store('profile-photos', 'public');
            $validated['photo'] = $path;
        }

        // Update profile
        $profile->fill($validated);
        $profile->save();

        // Also update user's name if provided
        if (isset($validated['name'])) {
            $user->name = $validated['name'];
            $user->save();
        }

        return response()->json([
            'message' => 'Profile saved successfully',
            'name' => $profile->name ?? $user->name,
            'email' => $user->email,
            'dob_nep' => $profile->dob_nep,
            'birth_time' => $profile->birth_time,
            'birth_place' => $profile->birth_place,
            'temp_address' => $profile->temp_address,
            'phone' => $profile->phone,
            'photo_url' => $profile->photo ? url('storage/' . $profile->photo) : null,
        ]);
    }
}
