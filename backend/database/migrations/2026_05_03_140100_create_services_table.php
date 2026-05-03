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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('users')->cascadeOnDelete();
            $table->string('service_type');
            $table->string('category');
            $table->string('title')->unique();
            $table->text('description');
            $table->string('location_city');
            $table->string('location_address')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('billing_unit');
            $table->unsignedInteger('capacity')->nullable();
            $table->string('duration_label')->nullable();
            $table->decimal('rating', 3, 1)->default(0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->string('status')->default('active');
            $table->boolean('is_featured')->default(false);
            $table->json('features')->nullable();
            $table->string('image_url')->nullable();
            $table->date('available_from')->nullable();
            $table->date('available_to')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
