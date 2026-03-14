<?php

use Tests\TestCase;
use App\Models\Filiere;
use Tests\Traits\ApiTokenTrait;

class FiliereTest extends TestCase
{
    use ApiTokenTrait;

    public function test_create_filiere()
    {
        $filiere = Filiere::factory()->make();

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->postJson('/api/filieres', [
                             'code_filiere' => $filiere->code_filiere,
                             'label_filiere' => $filiere->label_filiere,
                             'desc_filiere' => $filiere->desc_filiere,
                         ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'code_filiere',
                         'label_filiere',
                         'desc_filiere',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    // ✅ TEST SHOW FILIERE
    public function test_show_filiere()
    {
        $filiere = Filiere::factory()->create();

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->getJson("/api/filieres/{$filiere->code_filiere}");

        $response->assertStatus(200)
                 ->assertJson([
                     'code_filiere' => $filiere->code_filiere,
                     'label_filiere' => $filiere->label_filiere,
                     'desc_filiere' => $filiere->desc_filiere,
                 ]);
    }

    public function test_update_filiere()
    {
        $filiere = Filiere::factory()->create();

        $updateData = [
            'label_filiere' => 'Label mis à jour',
            'desc_filiere' => 'Description mise à jour',
        ];

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->putJson("/api/filieres/{$filiere->code_filiere}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'label_filiere' => 'Label mis à jour',
                     'desc_filiere' => 'Description mise à jour',
                 ]);
    }

    public function test_delete_filiere()
    {
        $filiere = Filiere::factory()->create();

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->deleteJson("/api/filieres/{$filiere->code_filiere}");

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Suppression réussie']);
    }
}
