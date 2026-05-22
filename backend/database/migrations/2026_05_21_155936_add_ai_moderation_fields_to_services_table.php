<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table): void {
            $table->unsignedTinyInteger('ai_risk_score')->default(0)->after('status');
            $table->enum('ai_risk_level', ['low', 'medium', 'high'])->default('low')->after('ai_risk_score');
            $table->boolean('ai_is_suspicious')->default(false)->after('ai_risk_level');
            $table->json('ai_reasons')->nullable()->after('ai_is_suspicious');
            $table->enum('ai_recommendation', ['approve', 'review', 'reject'])->default('approve')->after('ai_reasons');
            $table->boolean('ai_checked')->default(false)->after('ai_recommendation');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table): void {
            $table->dropColumn([
                'ai_risk_score',
                'ai_risk_level',
                'ai_is_suspicious',
                'ai_reasons',
                'ai_recommendation',
                'ai_checked',
            ]);
        });
    }
};
