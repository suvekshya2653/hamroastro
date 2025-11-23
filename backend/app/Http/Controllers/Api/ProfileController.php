<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Get user profile
     */
    public function show($userId)
    {
        $profile = UserProfile::where('user_id', $userId)->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Profile not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $profile
        ]);
    }

    /**
     * Update user profile
     */
    public function update(Request $request, $userId)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:user_profiles,username,' . $userId . ',user_id',
            'email' => 'required|email|unique:user_profiles,email,' . $userId . ',user_id',
            'address' => 'nullable|string|max:255',
            'dob' => 'nullable|date',
            'place_of_birth' => 'nullable|string|max:255',
            'temporary_address' => 'nullable|string',
            'permanent_address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $profile = UserProfile::where('user_id', $userId)->first();

        if (!$profile) {
            // Create new profile if doesn't exist
            $profile = UserProfile::create([
                'user_id' => $userId,
                ...$request->all()
            ]);
        } else {
            $profile->update($request->all());
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $profile
        ]);
    }

    /**
     * Upload avatar
     */
    public function uploadAvatar(Request $request, $userId)
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $profile = UserProfile::where('user_id', $userId)->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Profile not found'
            ], 404);
        }

        // Delete old avatar if exists
        if ($profile->avatar && Storage::disk('public')->exists($profile->avatar)) {
            Storage::disk('public')->delete($profile->avatar);
        }

        // Store new avatar
        $path = $request->file('avatar')->store('avatars', 'public');
        $profile->update(['avatar' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Avatar uploaded successfully',
            'data' => [
                'avatar_url' => Storage::url($path)
            ]
        ]);
    }

    /**
     * Delete avatar
     */
    public function deleteAvatar($userId)
    {
        $profile = UserProfile::where('user_id', $userId)->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Profile not found'
            ], 404);
        }

        if ($profile->avatar && Storage::disk('public')->exists($profile->avatar)) {
            Storage::disk('public')->delete($profile->avatar);
        }

        $profile->update(['avatar' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Avatar deleted successfully'
        ]);
    }
}
