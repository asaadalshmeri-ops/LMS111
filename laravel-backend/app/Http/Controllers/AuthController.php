<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Handle user login (Admin & Student)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        // 1. Try logging in by email
        $user = User::where('email', $request->email)->first();

        // 2. If not found by email, check if email is actually an Academic ID (Student Login)
        if (!$user) {
            $student = Student::where('academic_id', $request->email)->first();
            if ($student) {
                $user = $student->user;
            }
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'بيانات الاعتماد غير صحيحة.'
            ], 401);
        }

        // Generate Sanctum token
        $token = $user->createToken('lms-auth-token')->plainTextToken;

        $response = [
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ];

        // Include Student profile details if role is student
        if ($user->role === 'student' && $user->student) {
            $response['user']['studentId'] = $user->student->id;
            $response['user']['academicId'] = $user->student->academic_id;
            $response['user']['departmentId'] = $user->student->department_id;
            $response['user']['status'] = $user->student->status;
        }

        return response()->json($response);
    }

    /**
     * Setup password for student first-time login
     */
    public function firstTimeLoginSetup(Request $request)
    {
        $request->validate([
            'academicId' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $student = Student::where('academic_id', $request->academicId)->first();

        if (!$student) {
            return response()->json([
                'message' => 'الرقم الأكاديمي غير موجود بالنظام.'
            ], 404);
        }

        $user = $student->user;

        // Verify if student password was already set (e.g. check if it's default password or if they already set one)
        // For simplicity, allow setting password. We can check if they already set it.
        $user->password = Hash::make($request->password);
        $user->save();

        // Generate Sanctum token
        $token = $user->createToken('lms-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'تم إعداد كلمة المرور وتفعيل الحساب بنجاح.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'studentId' => $student->id,
                'academicId' => $student->academic_id,
                'departmentId' => $student->department_id,
                'status' => $student->status,
            ]
        ]);
    }

    /**
     * Get currently authenticated user details
     */
    public function getCurrentUser(Request $request)
    {
        $user = $request->user();
        
        $response = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];

        if ($user->role === 'student' && $user->student) {
            $response['studentId'] = $user->student->id;
            $response['academicId'] = $user->student->academic_id;
            $response['departmentId'] = $user->student->department_id;
            $response['status'] = $user->student->status;
        }

        return response()->json($response);
    }
}
