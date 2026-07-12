<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'full_name',
        'academic_id',
        'photo',
        'documents',
        'department_id',
        'status',
    ];

    protected $casts = [
        'documents' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function fees()
    {
        return $this->hasMany(Fee::class);
    }

    public function complaints()
    {
        return $this->hasMany(Complaint::class);
    }
}
