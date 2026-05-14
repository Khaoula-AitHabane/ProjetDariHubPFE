<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // Filtres metier
            $table->unsignedInteger('surface')->nullable()->after('capacity');         // m2 (immobilier)
            $table->boolean('furnished')->nullable()->after('surface');                // meuble / non meuble
            $table->string('condition', 20)->nullable()->after('furnished');           // 'new' | 'used' (meubles)
            $table->string('listing_kind', 20)->nullable()->after('condition');        // 'rent' | 'sale' (immobilier)
            // Geolocalisation pour Google Maps
            $table->decimal('latitude', 10, 7)->nullable()->after('location_address');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            // Index pour filtres rapides
            $table->index(['service_type', 'status']);
            $table->index('location_city');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropIndex(['service_type', 'status']);
            $table->dropIndex(['location_city']);
            $table->dropColumn(['surface', 'furnished', 'condition', 'listing_kind', 'latitude', 'longitude']);
        });
    }
};
