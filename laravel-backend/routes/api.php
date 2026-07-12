<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\StudentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/setup-password', [AuthController::class, 'firstTimeLoginSetup']);

// Protected routes (Requires Sanctum Authentication)
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth Profile
    Route::get('/me', [AuthController::class, 'getCurrentUser']);

    // Admin Endpoints
    Route::prefix('admin')->group(function () {
        // Students Management
        Route::post('/register', [AdminController::class, 'registerStudent']);
        Route::get('/students', [AdminController::class, 'getStudents']);
        Route::put('/students/{id}', [AdminController::class, 'updateStudent']);
        Route::delete('/students/{id}', [AdminController::class, 'deleteStudent']);

        // Departments Management
        Route::post('/departments', [AdminController::class, 'createDepartment']);
        Route::get('/departments', [AdminController::class, 'getDepartments']);
        Route::get('/departments/{id}', [AdminController::class, 'getDepartmentDetails']);

        // Lectures, Homeworks & Exams
        Route::post('/lectures', [AdminController::class, 'createLecture']);
        Route::post('/assignments', [AdminController::class, 'createAssignment']);
        Route::get('/assignments/{id}/submissions', [AdminController::class, 'getAssignmentSubmissions']);
        Route::post('/assignments/{id}/grade', [AdminController::class, 'gradeAssignmentSubmission']);
        
        Route::post('/exams', [AdminController::class, 'createExam']);
        Route::get('/exams/{id}/results', [AdminController::class, 'getExamResults']);
        Route::post('/exams/{id}/grade', [AdminController::class, 'gradeExamEssay']);

        // Finance / Fees
        Route::post('/fees', [AdminController::class, 'adjustFee']);

        // Complaints
        Route::get('/complaints', [AdminController::class, 'getComplaints']);
        Route::post('/complaints/{id}/respond', [AdminController::class, 'respondToComplaint']);
    });

    // Student Endpoints
    Route::prefix('student')->group(function () {
        // Lectures & Attendance
        Route::get('/lectures', [StudentController::class, 'getLectures']);
        Route::post('/lectures/{lectureId}/attend', [StudentController::class, 'markAttendance']);

        // Homework Assignments
        Route::get('/assignments', [StudentController::class, 'getAssignments']);
        Route::post('/assignments/{id}/submit', [StudentController::class, 'submitAssignment']);

        // Exams
        Route::get('/exams', [StudentController::class, 'getExams']);
        Route::post('/exams/{id}/submit', [StudentController::class, 'submitExam']);

        // Finance / Fees
        Route::get('/fees', [StudentController::class, 'getFeeSummary']);
        Route::post('/fees/{id}/receipt', [StudentController::class, 'uploadFeeReceipt']);

        // Notifications
        Route::get('/notifications', [StudentController::class, 'getNotifications']);
        Route::post('/notifications/{id}/read', [StudentController::class, 'markNotificationRead']);

        // Complaints
        Route::get('/complaints', [StudentController::class, 'getComplaints']);
        Route::post('/complaints', [StudentController::class, 'submitComplaint']);
    });

});
