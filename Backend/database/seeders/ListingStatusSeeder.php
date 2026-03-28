<?php

namespace Database\Seeders;

use App\Models\ListingStatus;
use Illuminate\Database\Seeder;

class ListingStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            ['title' => 'active'],
            ['title' => 'inactive'],
            ['title' => 'expired'],
            ['title' => 'completed'],
            ['title' => 'cancelled'],
        ];

        foreach ($statuses as $status) {
            ListingStatus::firstOrCreate($status);
        }
    }
}
