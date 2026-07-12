<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Departments Table
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->string('head_of_department')->nullable();
            $table->timestamps();
        });

        // 2. Students Table
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('full_name');
            $table->string('academic_id')->unique();
            $table->string('photo')->nullable();
            $table->json('documents')->nullable(); // multiple documents path
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->string('status')->default('Active'); // Active, Suspended, Graduated
            $table->timestamps();
        });

        // 3. Lectures Table
        Schema::create('lectures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->string('course_name');
            $table->integer('lecture_number');
            $table->string('youtube_link')->nullable();
            $table->string('pdf_path')->nullable();
            $table->json('diagrams')->nullable(); // array of diagrams path
            $table->unsignedBigInteger('connected_assignment_id')->nullable();
            $table->json('attendance')->nullable(); // array of student attendance records [{student_id, timestamp}]
            $table->timestamps();
        });

        // 4. Assignments Table
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lecture_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('instructions')->nullable();
            $table->dateTime('deadline');
            $table->json('submissions')->nullable(); // array of submissions [{student_id, file_path, grade, feedback, submitted_at}]
            $table->timestamps();
        });

        // 5. Exams Table
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->string('course_name');
            $table->dateTime('exam_date');
            $table->integer('duration_minutes');
            $table->json('questions'); // array of MCQ/Essay questions
            $table->json('results')->nullable(); // array of results [{student_id, score, answers, proctoring_video, proctoring_screen, submitted_at}]
            $table->timestamps();
        });

        // 6. Fees Table
        Schema::create('fees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('semester');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('remaining_amount', 10, 2);
            $table->string('status')->default('Unpaid'); // Paid, Partially Paid, Unpaid
            $table->string('receipt_path')->nullable();
            $table->timestamps();
        });

        // 7. Notifications Table
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->nullable()->constrained()->onDelete('cascade'); // Null means Global
            $table->string('title');
            $table->text('content');
            $table->string('type')->default('General'); // General, Exam, Assignment, Fee
            $table->json('read_by')->nullable(); // array of user_ids who read the notification
            $table->timestamps();
        });

        // 8. Complaints Table
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('subject');
            $table->text('description');
            $table->string('status')->default('Pending'); // Pending, In Progress, Resolved
            $table->text('admin_response')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complaints');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('fees');
        Schema::dropIfExists('exams');
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('lectures');
        Schema::dropIfExists('students');
        Schema::dropIfExists('departments');
    }
};
