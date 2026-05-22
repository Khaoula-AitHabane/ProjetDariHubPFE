<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiGenerationLog extends Model
{
    protected $table = 'ai_generations_logs';

    public $timestamps = false;

    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'input_data',
        'output_text',
        'style',
        'tokens_used',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'input_data' => 'array',
            'tokens_used' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
