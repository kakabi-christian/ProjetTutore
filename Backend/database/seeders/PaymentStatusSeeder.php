<?php

namespace Database\Seeders;

use App\Models\PaymentStatus;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PaymentStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            ['title' => 'pending'],
            ['title' => 'processing'],
            ['title' => 'completed'],
            ['title' => 'failed'],
            ['title' => 'refunded'],
            ['title' => 'cancelled'],
        ];

        foreach ($statuses as $status) {
            PaymentStatus::firstOrCreate($status);
        }
    }
}
