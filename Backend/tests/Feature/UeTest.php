<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Ue;
use App\Models\Niveau;
use Illuminate\Support\Str;
use Tests\Traits\ApiTokenTrait;

class UeTest extends TestCase
{
    use ApiTokenTrait;

    #[\PHPUnit\Framework\Attributes\Test]
    public function create_ue()
    {
        $niveau = Niveau::factory()->create();

        $ueData = Ue::factory()->make([
            'code_niveau' => $niveau->code_niveau,
            'code_ue' => 'UE' . Str::random(5), // code unique
            'label_ue' => 'UE ' . Str::random(5),
            'desc_ue' => 'Description ' . Str::random(5),
        ])->toArray();

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->postJson('/api/Ue', $ueData);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'code_ue',
                         'label_ue',
                         'desc_ue',
                         'code_niveau',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function update_ue()
    {
        $niveau = Niveau::factory()->create();
        $ue = Ue::factory()->create([
            'code_niveau' => $niveau->code_niveau,
            'code_ue' => 'UE' . Str::random(5),
        ]);

        $updateData = [
            'label_ue' => 'UE Mis à Jour ' . Str::random(5),
            'desc_ue' => 'Description mise à jour ' . Str::random(5),
        ];

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->putJson("/api/Ue/{$ue->code_ue}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'label_ue' => $updateData['label_ue'],
                     'desc_ue' => $updateData['desc_ue'],
                 ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function show_ue()
    {
        $niveau = Niveau::factory()->create();
        $ue = Ue::factory()->create([
            'code_niveau' => $niveau->code_niveau,
            'code_ue' => 'UE' . Str::random(5),
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->getJson("/api/Ue/{$ue->code_ue}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'code_ue',
                         'label_ue',
                         'desc_ue',
                         'code_niveau',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function delete_ue()
    {
        $niveau = Niveau::factory()->create();
        $ue = Ue::factory()->create([
            'code_niveau' => $niveau->code_niveau,
            'code_ue' => 'UE' . Str::random(5),
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->deleteJson("/api/Ue/{$ue->code_ue}");

        $response->assertStatus(200)
                 ->assertJson(['message' => 'UE supprimée avec succès']);
    }
}
