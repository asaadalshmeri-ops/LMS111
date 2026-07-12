<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'title',
        'content',
        'type',
        'read_by',
    ];

    protected $casts = [
        'read_by' => 'array',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
