<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lecture extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'course_name',
        'lecture_number',
        'youtube_link',
        'pdf_path',
        'diagrams',
        'connected_assignment_id',
        'attendance',
    ];

    protected $casts = [
        'diagrams' => 'array',
        'attendance' => 'array',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function assignment()
    {
        return $this->hasOne(Assignment::class, 'lecture_id');
    }
}
