<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\Personnel;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Personnel>
 */
class PersonnelFactory extends Factory
{
    protected $model = Personnel::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
       return [
        // ✅ Génération automatique d'UUID pour l'ID
        'id' => (string) Str::uuid(),

        'code_pers' => $this->faker->unique()->bothify('PERS###'),
        'nom_pers' => $this->faker->words(1,true),
        'sexe_pers' => $this->faker->randomElement(['Masculin','Feminin']),
        'phone_pers' => $this->faker->phoneNumber(),
        'login_pers' => $this->faker->unique()->safeEmail(),
        'pwd_pers' => Hash::make($this->faker->password()),
        'type_pers'=> $this->faker->randomElement(['RESPONSABLE DISCIPLINE','ENSEIGNANT','RESPONSABLE ACADEMIQUE']),
       ];
    }
}
