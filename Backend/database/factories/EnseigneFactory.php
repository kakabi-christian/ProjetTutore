<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Enseigne;
use App\Models\Personnel;
use App\Models\Ec;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Enseigne>
 */
class EnseigneFactory extends Factory
{
    protected $model = Enseigne::class;

    public function definition(): array
    {
        $personnel = Personnel::factory()->create();
        $ec = Ec::factory()->create();

        return [
            'id' => (string) Str::uuid(), // UUID pour l'id
            'code_pers' => $personnel->code_pers,
            'code_ec' => $ec->code_ec,
            'date_ens' => $this->faker->date(),
        ];
    }
}
