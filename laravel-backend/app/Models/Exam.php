<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'course_name',
        'exam_date',
        'duration_minutes',
        'questions',
        'results',
    ];

    protected $casts = [
        'questions' => 'array',
        'results' => 'array',
        'exam_date' => 'datetime',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
