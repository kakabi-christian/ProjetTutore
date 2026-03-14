<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Programmation;
use App\Models\Ec;
use App\Models\Salle;
use App\Models\Personnel;
use Tests\Traits\ApiTokenTrait;

class ProgrammationTest extends TestCase
{
    use ApiTokenTrait;

    /** @test */
    public function test_create_programmation()
    {
        $ec = Ec::factory()->create();
        $salle = Salle::factory()->create();
        $personnel = Personnel::factory()->create();

        $data = [
            'code_ec'     => $ec->code_ec,
            'num_salle'   => $salle->num_salle,
            'code_pers'   => $personnel->code_pers,
            'date'        => '2025-12-20',
            'heure_debut' => '08:00',
            'heure_fin'   => '10:00',
            'nbre_heure'  => 2,
            'status'      => 'Programmé',
        ];

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->postJson('/api/programmations', $data);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'id',
                         'code_ec',
                         'num_salle',
                         'code_pers',
                         'date',
                         'heure_debut',
                         'heure_fin',
                         'nbre_heure',
                         'status',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    /** @test */
    public function test_update_programmation()
    {
        $programmation = Programmation::factory()->create();

        $updateData = [
            'status' => 'Terminé',
        ];

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->putJson("/api/programmations/{$programmation->id}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonFragment(['status' => 'Terminé']);
    }

    /** @test */
    public function test_delete_programmation()
    {
        $programmation = Programmation::factory()->create();

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->deleteJson("/api/programmations/{$programmation->id}");

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Programmation supprimée avec succès']);
    }
}
