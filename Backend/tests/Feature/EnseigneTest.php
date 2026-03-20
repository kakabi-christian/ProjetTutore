<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Enseigne;
use App\Models\Personnel;
use App\Models\Ec;
use Tests\Traits\ApiTokenTrait;

class EnseigneTest extends TestCase
{
    use ApiTokenTrait;

    #[\PHPUnit\Framework\Attributes\Test]
    public function create_enseigne()
    {
        $personnel = Personnel::factory()->create();
        $ec = Ec::factory()->create();

        $enseigneData = Enseigne::factory()->make([
            'code_pers' => $personnel->code_pers,
            'code_ec'   => $ec->code_ec,
            'date_ens'  => now()->toDateString(),
        ])->toArray();

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->postJson('/api/enseignes', $enseigneData);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'id',
                         'code_pers',
                         'code_ec',
                         'date_ens',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function update_enseigne()
    {
        $personnel = Personnel::factory()->create();
        $ec = Ec::factory()->create();

        $enseigne = Enseigne::factory()->create([
            'code_pers' => $personnel->code_pers,
            'code_ec'   => $ec->code_ec,
            'date_ens'  => now()->subDay()->toDateString(),
        ]);

        $updateData = [
            'date_ens' => now()->toDateString(),
        ];

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->putJson("/api/enseignes/{$enseigne->id}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'date_ens' => $updateData['date_ens'],
                 ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function show_enseigne()
    {
        $personnel = Personnel::factory()->create();
        $ec = Ec::factory()->create();

        $enseigne = Enseigne::factory()->create([
            'code_pers' => $personnel->code_pers,
            'code_ec'   => $ec->code_ec,
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->getJson("/api/enseignes/{$enseigne->id}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'code_pers',
                         'code_ec',
                         'date_ens',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function delete_enseigne()
    {
        $personnel = Personnel::factory()->create();
        $ec = Ec::factory()->create();

        $enseigne = Enseigne::factory()->create([
            'code_pers' => $personnel->code_pers,
            'code_ec'   => $ec->code_ec,
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->deleteJson("/api/enseignes/{$enseigne->id}");

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Enseigne supprimée avec succès']);
    }
}
