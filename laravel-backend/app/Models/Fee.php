<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fee extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'semester',
        'total_amount',
        'paid_amount',
        'remaining_amount',
        'status',
        'receipt_path',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
