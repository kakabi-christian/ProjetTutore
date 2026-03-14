<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ue>
 */
class UeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code_ue' => $this->faker->unique()->bothify('UE###'),
            'label_ue' => $this->faker->words(1,true),
            'desc_ue' => $this->faker->sentence(),
            'code_niveau' => \App\Models\Niveau::inRandomOrder()->value('code_niveau'),
        ];
    }
}
