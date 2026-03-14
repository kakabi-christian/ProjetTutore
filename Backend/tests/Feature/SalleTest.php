<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Salle;
use Tests\Traits\ApiTokenTrait;

class SalleTest extends TestCase
{
    use ApiTokenTrait;

    #[\PHPUnit\Framework\Attributes\Test]
    public function create_salle()
    {
        $salle = Salle::factory()->make([
            'contenance' => fake()->numberBetween(20, 100), // valeur valide pour validation
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->postJson('/api/salles', [
                             'num_salle' => $salle->num_salle,
                             'contenance' => $salle->contenance,
                             'status' => $salle->status,
                         ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'num_salle',
                         'contenance',
                         'status',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function update_salle()
    {
        $salle = Salle::factory()->create([
            'contenance' => fake()->numberBetween(20, 100),
            'status' => 'Disponible',
        ]);

        $updateData = [
            'contenance' => $salle->contenance + 10,
            'status' => 'Indisponible',
        ];

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->putJson("/api/salles/{$salle->num_salle}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'contenance' => $updateData['contenance'],
                     'status' => $updateData['status'],
                 ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function show_salle()
    {
        $salle = Salle::factory()->create([
            'contenance' => fake()->numberBetween(20, 100),
            'status' => 'Disponible',
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->getJson("/api/salles/{$salle->num_salle}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'num_salle',
                         'contenance',
                         'status',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function delete_salle()
    {
        $salle = Salle::factory()->create([
            'contenance' => fake()->numberBetween(20, 100),
            'status' => 'Disponible',
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->deleteJson("/api/salles/{$salle->num_salle}");

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Salle supprimée avec succès']);
    }
}
