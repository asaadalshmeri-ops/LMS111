<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Lecture;
use App\Models\Assignment;
use App\Models\Exam;
use App\Models\Fee;
use App\Models\Notification;
use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;

class StudentController extends Controller
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
                'timeout' => 2
            ]);
        } catch (\Exception $e) {
            Log::warning("Socket bridge broadcast failed: " . $e->getMessage());
        }
    }

    /**
     * Helper to get student from request user
     */
    private function getStudent(Request $request)
    {
        $student = $request->user()->student;
        if (!$student) {
            abort(403, 'غير مصرح للوصول لملف الطالب.');
        }
        return $student;
    }

    /**
     * Mark student attendance in a lecture
     */
    public function markAttendance(Request $request, $lectureId)
    {
        $student = $this->getStudent($request);
        $lecture = Lecture::findOrFail($lectureId);

        // Check if student's department matches lecture's department
        if ($student->department_id !== $lecture->department_id) {
            return response()->json(['message' => 'هذه المحاضرة تتبع قسماً أكاديمياً آخر.'], 403);
        }

        $attendance = $lecture->attendance ?? [];

        // Check if already marked
        foreach ($attendance as $record) {
            if ((int)$record['studentId'] === (int)$student->id) {
                return response()->json(['message' => 'تم تسجيل حضورك في هذه المحاضرة بالفعل.'], 400);
            }
        }

        // Add attendance record
        $attendance[] = [
            'studentId' => $student->id,
            'timestamp' => now()->toIso8601String(),
        ];

        $lecture->attendance = $attendance;
        $lecture->save();

        // Broadcast event to admin
        $this->broadcast('activity_log', [
            'type' => 'attendance_marked',
            'description' => "قام الطالب {$student->full_name} بتسجيل حضور في محاضرة مقرر {$lecture->course_name}.",
            'timestamp' => now()->toIso8601String()
        ]);

        return response()->json([
            'message' => 'تم تسجيل حضورك في المحاضرة بنجاح.',
            'attendance' => $attendance
        ]);
    }

    /**
     * Get lectures for student's department
     */
    public function getLectures(Request $request)
    {
        $student = $this->getStudent($request);
        $lectures = Lecture::where('department_id', $student->department_id)->latest()->get();

        $mapped = $lectures->map(function($l) use ($student) {
            // Check if student is present
            $isPresent = false;
            $attendance = $l->attendance ?? [];
            foreach ($attendance as $record) {
                if ((int)$record['studentId'] === (int)$student->id) {
                    $isPresent = true;
                    break;
                }
            }

            return [
                'id' => $l->id,
                'courseName' => $l->course_name,
                'lectureNumber' => $l->lecture_number,
                'youtubeLink' => $l->youtube_link,
                'pdfPath' => $l->pdf_path,
                'diagrams' => $l->diagrams,
                'connectedAssignmentId' => $l->connected_assignment_id,
                'isPresent' => $isPresent,
            ];
        });

        return response()->json($mapped);
    }

    /**
     * Submit homework assignment (PDF file)
     */
    public function submitAssignment(Request $request, $id)
    {
        $student = $this->getStudent($request);
        $assignment = Assignment::findOrFail($id);

        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240', // Max 10MB PDF
        ]);

        $file = $request->file('file');
        $filename = 'sub_' . $student->academic_id . '_' . $id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('uploads/assignments'), $filename);
        $filePath = '/uploads/assignments/' . $filename;

        $submissions = $assignment->submissions ?? [];

        // Check if student already submitted to update, or add new
        $updated = false;
        foreach ($submissions as &$sub) {
            if ((int)$sub['studentId'] === (int)$student->id) {
                // Delete previous file if possible
                try {
                    $oldPath = public_path($sub['filePath']);
                    if (file_exists($oldPath)) unlink($oldPath);
                } catch (\Exception $e) {}

                $sub['filePath'] = $filePath;
                $sub['submittedAt'] = now()->toIso8601String();
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            $submissions[] = [
                'studentId' => $student->id,
                'filePath' => $filePath,
                'submittedAt' => now()->toIso8601String(),
                'grade' => null,
                'feedback' => '',
            ];
        }

        $assignment->submissions = $submissions;
        $assignment->save();

        // Broadcast event
        $this->broadcast('activity_log', [
            'type' => 'assignment_submitted',
            'description' => "قام الطالب {$student->full_name} بتسليم واجب '{$assignment->title}'.",
            'timestamp' => now()->toIso8601String()
        ]);

        return response()->json([
            'message' => 'تم تسليم الواجب بنجاح.',
            'filePath' => $filePath
        ]);
    }

    /**
     * Get student's assignments list
     */
    public function getAssignments(Request $request)
    {
        $student = $this->getStudent($request);
        
        $lectures = Lecture::where('department_id', $student->department_id)->pluck('id');
        $assignments = Assignment::whereIn('lecture_id', $lectures)->latest()->get();

        $mapped = $assignments->map(function($a) use ($student) {
            // Find student submission
            $mySubmission = null;
            $submissions = $a->submissions ?? [];
            foreach ($submissions as $sub) {
                if ((int)$sub['studentId'] === (int)$student->id) {
                    $mySubmission = [
                        'filePath' => $sub['filePath'],
                        'submittedAt' => $sub['submittedAt'],
                        'grade' => $sub['grade'],
                        'feedback' => $sub['feedback'],
                    ];
                    break;
                }
            }

            return [
                'id' => $a->id,
                'title' => $a->title,
                'instructions' => $a->instructions,
                'deadline' => $a->deadline,
                'courseName' => $a->lecture->course_name,
                'mySubmission' => $mySubmission,
            ];
        });

        return response()->json($mapped);
    }

    /**
     * Submit Exam with MCQ auto grading & Proctoring files upload
     */
    public function submitExam(Request $request, $id)
    {
        $student = $this->getStudent($request);
        $exam = Exam::findOrFail($id);

        $request->validate([
            'answers' => 'required|array', // array of answers [{questionIndex, studentAnswer}]
            'proctoringVideo' => 'nullable|file|mimes:webm,mp4,bin|max:102400', // Camera Proctoring
            'proctoringScreen' => 'nullable|file|mimes:webm,mp4,bin|max:102400', // Screen Proctoring
        ]);

        // Upload Proctoring files
        $videoPath = null;
        if ($request->hasFile('proctoringVideo')) {
            $video = $request->file('proctoringVideo');
            $filename = 'proc_cam_' . $student->academic_id . '_' . $id . '_' . time() . '.' . $video->getClientOriginalExtension();
            $video->move(public_path('uploads/exams'), $filename);
            $videoPath = '/uploads/exams/' . $filename;
        }

        $screenPath = null;
        if ($request->hasFile('proctoringScreen')) {
            $screen = $request->file('proctoringScreen');
            $filename = 'proc_scr_' . $student->academic_id . '_' . $id . '_' . time() . '.' . $screen->getClientOriginalExtension();
            $screen->move(public_path('uploads/exams'), $filename);
            $screenPath = '/uploads/exams/' . $filename;
        }

        // Decode exam questions & answers
        $questions = $exam->questions;
        $studentAnswers = $request->answers; // Assoc or normal array: [{questionIndex: 0, answerText: '...'}]
        
        $mcqScore = 0;
        $hasEssay = false;

        // Auto Grade MCQ Questions
        foreach ($questions as $qIndex => $question) {
            if ($question['type'] === 'mcq') {
                // Find student answer for this index
                $studentAnswerText = null;
                foreach ($studentAnswers as $ans) {
                    if ((int)$ans['questionIndex'] === (int)$qIndex) {
                        $studentAnswerText = $ans['studentAnswer'];
                        break;
                    }
                }

                // Standard clean comparison
                if (trim($studentAnswerText) === trim($question['correctAnswer'])) {
                    $mcqScore += (float)($question['points'] ?? 1);
                }
            } else {
                $hasEssay = true;
            }
        }

        $results = $exam->results ?? [];

        // Check if student already submitted to prevent dual submission
        foreach ($results as $res) {
            if ((int)$res['studentId'] === (int)$student->id) {
                return response()->json(['message' => 'لقد قدمت هذا الاختبار بالفعل.'], 400);
            }
        }

        // Add result record
        $results[] = [
            'studentId' => $student->id,
            'score' => $mcqScore, // Initial score (MCQ only, Essay added by Admin later)
            'proctoringVideo' => $videoPath,
            'proctoringScreen' => $screenPath,
            'submittedAt' => now()->toIso8601String(),
            'answers' => $studentAnswers,
        ];

        $exam->results = $results;
        $exam->save();

        // Broadcast to Admin
        $this->broadcast('activity_log', [
            'type' => 'exam_submitted',
            'description' => "قام الطالب {$student->full_name} بتقديم اختبار مقرر {$exam->course_name} (الدرجة المبدئية للـ MCQ: {$mcqScore}).",
            'timestamp' => now()->toIso8601String()
        ]);

        return response()->json([
            'message' => 'تم تسليم الاختبار بنجاح.',
            'score' => $mcqScore,
            'hasEssay' => $hasEssay
        ]);
    }

    /**
     * Get exams list for student's department
     */
    public function getExams(Request $request)
    {
        $student = $this->getStudent($request);
        $exams = Exam::where('department_id', $student->department_id)->latest()->get();

        $mapped = $exams->map(function($e) use ($student) {
            // Check if student already submitted
            $myResult = null;
            $results = $e->results ?? [];
            foreach ($results as $res) {
                if ((int)$res['studentId'] === (int)$student->id) {
                    $myResult = [
                        'score' => $res['score'],
                        'submittedAt' => $res['submittedAt'],
                    ];
                    break;
                }
            }

            return [
                'id' => $e->id,
                'courseName' => $e->course_name,
                'examDate' => $e->exam_date,
                'durationMinutes' => $e->duration_minutes,
                'questionsCount' => count($e->questions),
                'myResult' => $myResult,
                // Omit correctAnswer from questions before sending to student to prevent cheating!
                'questions' => collect($e->questions)->map(function($q) {
                    return [
                        'type' => $q['type'],
                        'questionText' => $q['questionText'],
                        'options' => $q['options'] ?? null,
                        'points' => $q['points'] ?? 1,
                    ];
                })
            ];
        });

        return response()->json($mapped);
    }

    /**
     * Get student financial bill summary
     */
    public function getFeeSummary(Request $request)
    {
        $student = $this->getStudent($request);
        $fees = Fee::where('student_id', $student->id)->get();

        return response()->json($fees->map(function($f) {
            return [
                'id' => $f->id,
                'semester' => $f->semester,
                'totalAmount' => $f->total_amount,
                'paidAmount' => $f->paid_amount,
                'remainingAmount' => $f->remaining_amount,
                'status' => $f->status,
                'receiptPath' => $f->receipt_path,
            ];
        }));
    }

    /**
     * Upload billing/fee receipt
     */
    public function uploadFeeReceipt(Request $request, $id)
    {
        $student = $this->getStudent($request);
        $fee = Fee::where('id', $id)->where('student_id', $student->id)->firstOrFail();

        $request->validate([
            'receipt' => 'required|image|max:10240', // Receipt photo
        ]);

        $receipt = $request->file('receipt');
        $filename = 'receipt_' . $student->academic_id . '_' . $id . '_' . time() . '.' . $receipt->getClientOriginalExtension();
        $receipt->move(public_path('uploads/fees'), $filename);
        $receiptPath = '/uploads/fees/' . $filename;

        // Update fee status to Partially Paid for review, save path
        $fee->receipt_path = $receiptPath;
        if ($fee->status === 'Unpaid') {
            $fee->status = 'Partially Paid';
        }
        $fee->save();

        // Broadcast to Admin
        $this->broadcast('activity_log', [
            'type' => 'fee_receipt_uploaded',
            'description' => "قام الطالب {$student->full_name} برفع إيصال دفع للفصل الدراسي {$fee->semester}.",
            'timestamp' => now()->toIso8601String()
        ]);

        return response()->json([
            'message' => 'تم رفع إيصال الدفع وجاري مراجعته من قِبل الإدارة.',
            'receiptPath' => $receiptPath
        ]);
    }

    /**
     * Get student notifications
     */
    public function getNotifications(Request $request)
    {
        $student = $this->getStudent($request);

        // Fetch notifications: global (department_id is null) OR student's department
        $notifications = Notification::whereNull('department_id')
            ->orWhere('department_id', $student->department_id)
            ->latest()
            ->get();

        return response()->json($notifications->map(function($n) use ($student) {
            $readBy = $n->read_by ?? [];
            return [
                'id' => $n->id,
                'title' => $n->title,
                'content' => $n->content,
                'type' => $n->type,
                'createdAt' => $n->created_at,
                'isRead' => in_array($student->user_id, $readBy),
            ];
        }));
    }

    /**
     * Mark notification as read
     */
    public function markNotificationRead(Request $request, $id)
    {
        $user = $request->user();
        $notification = Notification::findOrFail($id);

        $readBy = $notification->read_by ?? [];
        if (!in_array($user->id, $readBy)) {
            $readBy[] = $user->id;
            $notification->read_by = $readBy;
            $notification->save();
        }

        return response()->json(['message' => 'تم تحديد الإعلان كمقروء.']);
    }

    /**
     * Submit complaint
     */
    public function submitComplaint(Request $request)
    {
        $student = $this->getStudent($request);

        $request->validate([
            'subject' => 'required|string',
            'description' => 'required|string',
        ]);

        $complaint = Complaint::create([
            'student_id' => $student->id,
            'subject' => $request->subject,
            'description' => $request->description,
            'status' => 'Pending',
        ]);

        // Broadcast to Admin
        $this->broadcast('activity_log', [
            'type' => 'complaint_submitted',
            'description' => "قام الطالب {$student->full_name} بتقديم شكوى تحت موضوع '{$request->subject}'.",
            'timestamp' => now()->toIso8601String()
        ]);

        return response()->json([
            'message' => 'تم تقديم الشكوى بنجاح وسيتم مراجعتها قريباً.',
            'complaint' => $complaint
        ], 201);
    }

    /**
     * Get list of student's complaints
     */
    public function getComplaints(Request $request)
    {
        $student = $this->getStudent($request);
        $complaints = Complaint::where('student_id', $student->id)->latest()->get();

        return response()->json($complaints->map(function($c) {
            return [
                'id' => $c->id,
                'subject' => $c->subject,
                'description' => $c->description,
                'status' => $c->status,
                'adminResponse' => $c->admin_response,
                'createdAt' => $c->created_at,
            ];
        }));
    }
}
