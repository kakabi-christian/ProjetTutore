<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ec>
 */
class EcFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code_ec' => $this->faker->unique()->bothify('EC###'),
            'label_ec' => $this->faker->words(1,true), 
            'desc_ec' => $this->faker->sentence(),
            'nbh_ec' => $this->faker->randomDigit(),
            'nbc_ec' => $this->faker->randomDigit(),
            'code_ue' => \App\Models\Ue::inRandomOrder()->value('code_ue'),
        ];
    }
}
