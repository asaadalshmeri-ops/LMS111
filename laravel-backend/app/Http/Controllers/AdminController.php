<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\Department;
use App\Models\Lecture;
use App\Models\Assignment;
use App\Models\Exam;
use App\Models\Fee;
use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;

class AdminController extends Controller
{
    /**
     * Helper to broadcast events to socket-bridge
     */
    private function broadcast($event, $data)
    {
        try {
            $client = new Client();
            $socketUrl = env('SOCKET_BRIDGE_URL', 'http://localhost:5001') . '/broadcast';
            $client->post($socketUrl, [
                'json' => [
                    'event' => $event,
                    'data' => $data
                ],
                'timeout' => 2 // brief timeout to not block requests
            ]);
        } catch (\Exception $e) {
            Log::warning("Socket bridge broadcast failed: " . $e->getMessage());
        }
    }

    /**
     * Register a new student
     */
    public function registerStudent(Request $request)
    {
        $request->validate([
            'fullName' => 'required|string',
            'departmentId' => 'required|exists:departments,id',
            'photo' => 'nullable|image|max:5120',
            'documents.*' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        return DB::transaction(function () use ($request) {
            $year = date('Y');
            
            // Auto generate Academic ID: YYYYXXXXX (e.g. 202600001)
            $lastStudent = Student::where('academic_id', 'like', $year . '%')
                ->orderBy('academic_id', 'desc')
                ->first();

            if ($lastStudent) {
                $lastSeq = (int) substr($lastStudent->academic_id, 4);
                $nextSeq = str_pad($lastSeq + 1, 5, '0', STR_PAD_LEFT);
            } else {
                $nextSeq = '00001';
            }
            $academicId = $year . $nextSeq;
            $email = $academicId . '@lms.com';

            // Create User account
            $user = User::create([
                'name' => $request->fullName,
                'email' => $email,
                'password' => Hash::make($academicId), // Default password is academic id
                'role' => 'student',
            ]);

            // Handle Photo upload
            $photoPath = null;
            if ($request->hasFile('photo')) {
                $photo = $request->file('photo');
                $filename = 'profile_' . $academicId . '_' . time() . '.' . $photo->getClientOriginalExtension();
                $photo->move(public_path('uploads/profiles'), $filename);
                $photoPath = '/uploads/profiles/' . $filename;
            }

            // Handle Documents upload
            $docPaths = [];
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $index => $doc) {
                    $filename = 'doc_' . $academicId . '_' . $index . '_' . time() . '.' . $doc->getClientOriginalExtension();
                    $doc->move(public_path('uploads/documents'), $filename);
                    $docPaths[] = '/uploads/documents/' . $filename;
                }
            }

            // Create Student profile
            $student = Student::create([
                'user_id' => $user->id,
                'full_name' => $request->fullName,
                'academic_id' => $academicId,
                'photo' => $photoPath,
                'documents' => $docPaths,
                'department_id' => $request->departmentId,
                'status' => 'Active',
            ]);

            // Broadcast real-time activity log
            $this->broadcast('activity_log', [
                'type' => 'student_registered',
                'description' => "تم تسجيل الطالب الجديد {$request->fullName} برقم أكاديمي {$academicId}.",
                'timestamp' => now()->toIso8601String()
            ]);

            return response()->json([
                'message' => 'تم تسجيل الطالب بنجاح.',
                'academicId' => $academicId,
                'student' => $student
            ], 201);
        });
    }

    /**
     * Get all students with pagination & search
     */
    public function getStudents(Request $request)
    {
        $query = Student::with(['user', 'department']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('academic_id', 'like', "%{$search}%");
            });
        }

        $students = $query->latest()->get();

        // Map to format matching MERN response fields
        $mapped = $students->map(function($student) {
            return [
                'id' => $student->id,
                'fullName' => $student->full_name,
                'academicId' => $student->academic_id,
                'email' => $student->user->email,
                'photo' => $student->photo,
                'documents' => $student->documents,
                'department' => [
                    'id' => $student->department->id,
                    'name' => $student->department->name,
                ],
                'status' => $student->status,
                'createdAt' => $student->created_at,
            ];
        });

        return response()->json($mapped);
    }

    /**
     * Update student details
     */
    public function updateStudent(Request $request, $id)
    {
        $student = Student::findOrFail($id);

        $request->validate([
            'fullName' => 'required|string',
            'departmentId' => 'required|exists:departments,id',
            'status' => 'required|string|in:Active,Suspended,Graduated',
        ]);

        $student->full_name = $request->fullName;
        $student->department_id = $request->departmentId;
        $student->status = $request->status;
        $student->save();

        // Update User name
        $user = $student->user;
        $user->name = $request->fullName;
        $user->save();

        return response()->json([
            'message' => 'تم تحديث سجل الطالب بنجاح.',
            'student' => $student
        ]);
    }

    /**
     * Delete student profile and User account
     */
    public function deleteStudent($id)
    {
        $student = Student::findOrFail($id);
        $user = $student->user;

        DB::transaction(function () use ($student, $user) {
            $student->delete();
            if ($user) {
                $user->delete();
            }
        });

        return response()->json([
            'message' => 'تم حذف سجل الطالب بنجاح.'
        ]);
    }

    /**
     * Create department
     */
    public function createDepartment(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:departments,name',
            'description' => 'nullable|string',
            'headOfDepartment' => 'nullable|string',
        ]);

        $dept = Department::create([
            'name' => $request->name,
            'description' => $request->description,
            'head_of_department' => $request->headOfDepartment,
        ]);

        return response()->json([
            'message' => 'تم إنشاء القسم بنجاح.',
            'department' => $dept
        ], 201);
    }

    /**
     * Get all departments
     */
    public function getDepartments()
    {
        $depts = Department::all();
        
        $mapped = $depts->map(function($dept) {
            return [
                'id' => $dept->id,
                'name' => $dept->name,
                'description' => $dept->description,
                'headOfDepartment' => $dept->head_of_department,
            ];
        });

        return response()->json($mapped);
    }

    /**
     * Get department details (students, lectures, exams)
     */
    public function getDepartmentDetails($id)
    {
        $dept = Department::findOrFail($id);

        $students = Student::where('department_id', $id)->with('user')->get();
        $lectures = Lecture::where('department_id', $id)->get();
        $exams = Exam::where('department_id', $id)->get();

        return response()->json([
            'department' => [
                'id' => $dept->id,
                'name' => $dept->name,
                'description' => $dept->description,
                'headOfDepartment' => $dept->head_of_department,
            ],
            'students' => $students->map(function($s) {
                return [
                    'id' => $s->id,
                    'fullName' => $s->full_name,
                    'academicId' => $s->academic_id,
                    'photo' => $s->photo,
                    'status' => $s->status,
                ];
            }),
            'lectures' => $lectures->map(function($l) {
                return [
                    'id' => $l->id,
                    'courseName' => $l->course_name,
                    'lectureNumber' => $l->lecture_number,
                    'youtubeLink' => $l->youtube_link,
                    'pdfPath' => $l->pdf_path,
                ];
            }),
            'exams' => $exams->map(function($e) {
                return [
                    'id' => $e->id,
                    'courseName' => $e->course_name,
                    'examDate' => $e->exam_date,
                    'durationMinutes' => $e->duration_minutes,
                ];
            })
        ]);
    }

    /**
     * Create lecture
     */
    public function createLecture(Request $request)
    {
        $request->validate([
            'departmentId' => 'required|exists:departments,id',
            'courseName' => 'required|string',
            'lectureNumber' => 'required|integer',
            'youtubeLink' => 'nullable|string',
            'pdf' => 'nullable|file|mimes:pdf|max:10240',
            'diagrams.*' => 'nullable|image|max:5120',
        ]);

        // Handle PDF upload
        $pdfPath = null;
        if ($request->hasFile('pdf')) {
            $pdf = $request->file('pdf');
            $filename = 'lecture_' . time() . '.' . $pdf->getClientOriginalExtension();
            $pdf->move(public_path('uploads/assignments'), $filename);
            $pdfPath = '/uploads/assignments/' . $filename;
        }

        // Handle diagrams upload
        $diagramPaths = [];
        if ($request->hasFile('diagrams')) {
            foreach ($request->file('diagrams') as $index => $diag) {
                $filename = 'diag_' . $index . '_' . time() . '.' . $diag->getClientOriginalExtension();
                $diag->move(public_path('uploads/assignments'), $filename);
                $diagramPaths[] = '/uploads/assignments/' . $filename;
            }
        }

        $lecture = Lecture::create([
            'department_id' => $request->departmentId,
            'course_name' => $request->courseName,
            'lecture_number' => $request->lectureNumber,
            'youtube_link' => $request->youtubeLink,
            'pdf_path' => $pdfPath,
            'diagrams' => $diagramPaths,
            'attendance' => [],
        ]);

        $this->broadcast('activity_log', [
            'type' => 'lecture_created',
            'description' => "تمت إضافة محاضرة جديدة رقم {$request->lectureNumber} في مقرر {$request->courseName}.",
            'timestamp' => now()->toIso8601String()
        ]);

        return response()->json([
            'message' => 'تم إنشاء المحاضرة بنجاح.',
            'lecture' => $lecture
        ], 201);
    }

    /**
     * Create assignment linked to lecture
     */
    public function createAssignment(Request $request)
    {
        $request->validate([
            'lectureId' => 'required|exists:lectures,id',
            'title' => 'required|string',
            'instructions' => 'nullable|string',
            'deadline' => 'required|date',
        ]);

        $assignment = Assignment::create([
            'lecture_id' => $request->lectureId,
            'title' => $request->title,
            'instructions' => $request->instructions,
            'deadline' => $request->deadline,
            'submissions' => [],
        ]);

        // Connect back to Lecture
        $lecture = Lecture::findOrFail($request->lectureId);
        $lecture->connected_assignment_id = $assignment->id;
        $lecture->save();

        return response()->json([
            'message' => 'تم إنشاء الواجب بنجاح.',
            'assignment' => $assignment
        ], 201);
    }

    /**
     * Get all submissions for an assignment
     */
    public function getAssignmentSubmissions($id)
    {
        $assignment = Assignment::findOrFail($id);
        
        $submissions = $assignment->submissions ?? [];

        // Eager load student names for formatting response
        $formatted = [];
        foreach ($submissions as $sub) {
            $student = Student::find($sub['studentId']);
            $formatted[] = [
                'studentId' => $sub['studentId'],
                'studentName' => $student ? $student->full_name : 'طالب غير معروف',
                'academicId' => $student ? $student->academic_id : '',
                'filePath' => $sub['filePath'],
                'submittedAt' => $sub['submittedAt'],
                'grade' => $sub['grade'] ?? null,
                'feedback' => $sub['feedback'] ?? '',
            ];
        }

        return response()->json($formatted);
    }

    /**
     * Grade assignment submission
     */
    public function gradeAssignmentSubmission(Request $request, $id)
    {
        $request->validate([
            'studentId' => 'required|integer',
            'grade' => 'required|numeric',
            'feedback' => 'nullable|string',
        ]);

        $assignment = Assignment::findOrFail($id);
        $submissions = $assignment->submissions ?? [];

        $updated = false;
        foreach ($submissions as &$sub) {
            if ((int)$sub['studentId'] === (int)$request->studentId) {
                $sub['grade'] = $request->grade;
                $sub['feedback'] = $request->feedback ?? '';
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            return response()->json(['message' => 'لم يتم العثور على تسليم لهذا الطالب.'], 404);
        }

        $assignment->submissions = $submissions;
        $assignment->save();

        // Broadcast to student
        $student = Student::find($request->studentId);
        if ($student) {
            $this->broadcast('activity_log', [
                'type' => 'assignment_graded',
                'description' => "تم رصد درجة الواجب '{$assignment->title}' للطالب {$student->full_name}.",
                'timestamp' => now()->toIso8601String()
            ]);
        }

        return response()->json([
            'message' => 'تم رصد درجة الواجب بنجاح.',
            'submissions' => $submissions
        ]);
    }

    /**
     * Create exam
     */
    public function createExam(Request $request)
    {
        $request->validate([
            'departmentId' => 'required|exists:departments,id',
            'courseName' => 'required|string',
            'examDate' => 'required|date',
            'durationMinutes' => 'required|integer',
            'questions' => 'required|array',
        ]);

        $exam = Exam::create([
            'department_id' => $request->departmentId,
            'course_name' => $request->courseName,
            'exam_date' => $request->examDate,
            'duration_minutes' => $request->durationMinutes,
            'questions' => $request->questions,
            'results' => [],
        ]);

        return response()->json([
            'message' => 'تم إنشاء الاختبار بنجاح.',
            'exam' => $exam
        ], 201);
    }

    /**
     * Get all exam results & proctoring logs
     */
    public function getExamResults($id)
    {
        $exam = Exam::findOrFail($id);
        $results = $exam->results ?? [];

        $formatted = [];
        foreach ($results as $res) {
            $student = Student::find($res['studentId']);
            $formatted[] = [
                'studentId' => $res['studentId'],
                'studentName' => $student ? $student->full_name : 'طالب غير معروف',
                'academicId' => $student ? $student->academic_id : '',
                'score' => $res['score'],
                'proctoringVideo' => $res['proctoringVideo'] ?? null,
                'proctoringScreen' => $res['proctoringScreen'] ?? null,
                'submittedAt' => $res['submittedAt'],
                'answers' => $res['answers'],
            ];
        }

        return response()->json($formatted);
    }

    /**
     * Grade Exam Essay questions and update total score
     */
    public function gradeExamEssay(Request $request, $id)
    {
        $request->validate([
            'studentId' => 'required|integer',
            'score' => 'required|numeric', // Total calculated score
        ]);

        $exam = Exam::findOrFail($id);
        $results = $exam->results ?? [];

        $updated = false;
        foreach ($results as &$res) {
            if ((int)$res['studentId'] === (int)$request->studentId) {
                $res['score'] = $request->score;
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            return response()->json(['message' => 'لم يتم العثور على نتيجة لهذا الطالب.'], 404);
        }

        $exam->results = $results;
        $exam->save();

        $student = Student::find($request->studentId);
        if ($student) {
            $this->broadcast('activity_log', [
                'type' => 'exam_graded',
                'description' => "تم رصد وتصحيح درجة اختبار مقرر {$exam->course_name} للطالب {$student->full_name}.",
                'timestamp' => now()->toIso8601String()
            ]);
        }

        return response()->json([
            'message' => 'تم رصد درجة الاختبار وتحديثها بنجاح.',
            'results' => $results
        ]);
    }

    /**
     * Adjust student fee record
     */
    public function adjustFee(Request $request, $id)
    {
        $request->validate([
            'studentId' => 'required|exists:students,id',
            'semester' => 'required|string',
            'totalAmount' => 'required|numeric',
            'paidAmount' => 'required|numeric',
        ]);

        $remaining = $request->totalAmount - $request->paidAmount;
        if ($remaining <= 0) {
            $status = 'Paid';
            $remaining = 0;
        } elseif ($request->paidAmount > 0) {
            $status = 'Partially Paid';
        } else {
            $status = 'Unpaid';
        }

        // Find or create fee record
        $fee = Fee::updateOrCreate(
            ['student_id' => $request->studentId, 'semester' => $request->semester],
            [
                'total_amount' => $request->totalAmount,
                'paid_amount' => $request->paidAmount,
                'remaining_amount' => $remaining,
                'status' => $status
            ]
        );

        $student = Student::find($request->studentId);
        if ($student) {
            $this->broadcast('activity_log', [
                'type' => 'fee_adjusted',
                'description' => "تم تسوية حساب الرسوم للفصل الدراسي {$request->semester} للطالب {$student->full_name}.",
                'timestamp' => now()->toIso8601String()
            ]);
        }

        return response()->json([
            'message' => 'تم تسوية وتحديث الفاتورة المالية بنجاح.',
            'fee' => $fee
        ]);
    }

    /**
     * Get all complaints
     */
    public function getComplaints()
    {
        $complaints = Complaint::with('student')->latest()->get();

        $mapped = $complaints->map(function($c) {
            return [
                'id' => $c->id,
                'studentName' => $c->student ? $c->student->full_name : 'طالب غير معروف',
                'academicId' => $c->student ? $c->student->academic_id : '',
                'subject' => $c->subject,
                'description' => $c->description,
                'status' => $c->status,
                'adminResponse' => $c->admin_response,
                'createdAt' => $c->created_at,
            ];
        });

        return response()->json($mapped);
    }

    /**
     * Respond to complaint
     */
    public function respondToComplaint(Request $request, $id)
    {
        $request->validate([
            'adminResponse' => 'required|string',
            'status' => 'required|string|in:In Progress,Resolved',
        ]);

        $complaint = Complaint::findOrFail($id);
        $complaint->admin_response = $request->adminResponse;
        $complaint->status = $request->status;
        $complaint->save();

        if ($complaint->student) {
            $this->broadcast('activity_log', [
                'type' => 'complaint_responded',
                'description' => "تم الرد على الشكوى المقدمة من الطالب {$complaint->student->full_name}.",
                'timestamp' => now()->toIso8601String()
            ]);
        }

        return response()->json([
            'message' => 'تم تسجيل الرد على الشكوى بنجاح.',
            'complaint' => $complaint
        ]);
    }
}
