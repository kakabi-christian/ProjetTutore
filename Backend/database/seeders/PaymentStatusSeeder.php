<?php

namespace Database\Seeders;

use App\Models\PaymentStatus;
use Illuminate\Database\Seeder;

class PaymentStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            ['title' => 'PENDING'],
            ['title' => 'SUCCESS'],
            ['title' => 'FAILED'],
            ['title' => 'REFUNDED'],
        ];

        foreach ($statuses as $status) {
            PaymentStatus::firstOrCreate($status);
        }
    }
}
