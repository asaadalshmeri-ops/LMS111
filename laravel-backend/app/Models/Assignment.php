<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'lecture_id',
        'title',
        'instructions',
        'deadline',
        'submissions',
    ];

    protected $casts = [
        'submissions' => 'array',
        'deadline' => 'datetime',
    ];

    public function lecture()
    {
        return $this->belongsTo(Lecture::class);
    }
}
