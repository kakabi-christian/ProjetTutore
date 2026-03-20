<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Programmation>
 */
class ProgrammationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // 🔥 Génération automatique d'un UUID pour l'ID
            'id' => (string) Str::uuid(),

            'code_ec' => \App\Models\Ec::inRandomOrder()->value('code_ec'),
            'num_salle' => \App\Models\Salle::inRandomOrder()->value('num_salle'),
            'code_pers'=> \App\Models\Personnel::inRandomOrder()->value('code_pers'),
            'date'=> $this->faker->date(),
            'heure_debut'=> $this->faker->time(),
            'heure_fin'=> $this->faker->time(),
            'nbre_heure'=> $this->faker->randomDigit(),
            'Status'=> $this->faker->randomElement(['Programmé', 'Annulé', 'Terminé']),
        ];
    }
}
