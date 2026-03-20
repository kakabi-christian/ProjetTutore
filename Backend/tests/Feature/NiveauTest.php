<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Niveau;
use App\Models\Filiere;
use Tests\Traits\ApiTokenTrait;

class NiveauTest extends TestCase
{
    use ApiTokenTrait;

    /** @test */
    public function test_create_niveau()
    {
        $filiere = Filiere::factory()->create();
        $niveauData = Niveau::factory()->make([
            'code_filiere' => $filiere->code_filiere,
        ])->toArray();

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->postJson('/api/niveaux', $niveauData);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'code_niveau',
                         'label_niveau',
                         'desc_niveau',
                         'code_filiere',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    /** @test */
    public function test_update_niveau()
    {
        $filiere = Filiere::factory()->create();
        $niveau = Niveau::factory()->create([
            'code_filiere' => $filiere->code_filiere,
        ]);

        $updateData = [
            'label_niveau' => $niveau->label_niveau . ' Mis à Jour',
            'desc_niveau' => $niveau->desc_niveau . ' mise à jour',
        ];

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->putJson("/api/niveaux/{$niveau->code_niveau}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonFragment($updateData);
    }

    /** @test */
    public function test_show_niveau()
    {
        $filiere = Filiere::factory()->create();
        $niveau = Niveau::factory()->create([
            'code_filiere' => $filiere->code_filiere,
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->getJson("/api/niveaux/{$niveau->code_niveau}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'code_niveau',
                         'label_niveau',
                         'desc_niveau',
                         'code_filiere',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    /** @test */
    public function test_delete_niveau()
    {
        $filiere = Filiere::factory()->create();
        $niveau = Niveau::factory()->create([
            'code_filiere' => $filiere->code_filiere,
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->deleteJson("/api/niveaux/{$niveau->code_niveau}");

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Niveau supprimé avec succès']); // ⚡ message corrigé
    }
}
