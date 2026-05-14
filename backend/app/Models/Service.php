<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $fillable = [
        'provider_id',
        'service_type',
        'category',
        'title',
        'description',
        'location_city',
        'location_address',
        'price',
        'billing_unit',
        'capacity',
        'surface',
        'furnished',
        'condition',
        'listing_kind',
        'latitude',
        'longitude',
        'duration_label',
        'rating',
        'reviews_count',
        'status',
        'is_featured',
        'features',
        'image_url',
        'source_url',
        'available_from',
        'available_to',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'rating' => 'decimal:1',
            'is_featured' => 'boolean',
            'furnished' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'features' => 'array',
            'available_from' => 'date',
            'available_to' => 'date',
        ];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
