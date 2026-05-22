<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchLog extends Model
{
    protected $fillable = [
        'query',
        'parsed_intent',
        'results_count',
        'user_id'
    ];

    protected function casts(): array
    {
        return [
            'parsed_intent' => 'array',
            'results_count' => 'integer',
        ];
    }
}
