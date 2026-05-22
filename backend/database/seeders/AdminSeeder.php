<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@darihub.com'],
            [
                'name' => 'Administrateur DariHub',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'status' => 'actif',
                'city' => 'Casablanca',
                'phone' => '0600000000',
            ]
        );
    }
}
