<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Niveau>
 */
class NiveauFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
   public function definition(): array
{
    return [
        
        'label_niveau' => $this->faker->words(1, true),
        'desc_niveau' => $this->faker->words(1, true),
        // 🔥 Récupère un code existant dans la table filiere
        'code_filiere' => \App\Models\Filiere::inRandomOrder()->value('code_filiere'),
    ];
}

}
