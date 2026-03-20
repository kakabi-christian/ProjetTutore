<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Ec;
use App\Models\Ue;
use Illuminate\Support\Str;
use Tests\Traits\ApiTokenTrait;

class EcTest extends TestCase
{
    use ApiTokenTrait;

    /** @test */
    public function test_create_ec()
    {
        $ue = Ue::factory()->create();

        $ecData = [
            'code_ec' => 'EC' . Str::random(8), // code unique
            'label_ec' => 'EC ' . Str::random(5),
            'desc_ec' => 'Description EC ' . Str::random(5),
            'nbh_ec' => rand(10, 30),
            'nbc_ec' => rand(20, 40),
            'code_ue' => $ue->code_ue,
        ];

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->postJson('/api/ec', $ecData);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'code_ec',
                         'label_ec',
                         'desc_ec',
                         'nbh_ec',
                         'nbc_ec',
                         'code_ue',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    /** @test */
    public function test_update_ec()
    {
        $ue = Ue::factory()->create();
        $ec = Ec::factory()->create([
            'code_ue' => $ue->code_ue,
            'code_ec' => 'EC' . Str::random(8), // code unique
        ]);

        $updateData = [
            'label_ec' => 'EC ' . Str::random(5),
            'desc_ec' => 'Description mise à jour ' . Str::random(5),
            'nbh_ec' => rand(10, 30),
            'nbc_ec' => rand(20, 40),
        ];

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->putJson("/api/ec/{$ec->code_ec}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'label_ec' => $updateData['label_ec'],
                     'desc_ec' => $updateData['desc_ec'],
                     'nbh_ec' => $updateData['nbh_ec'],
                     'nbc_ec' => $updateData['nbc_ec'],
                 ]);
    }

    /** @test */
    public function test_show_ec()
    {
        $ue = Ue::factory()->create();
        $ec = Ec::factory()->create([
            'code_ue' => $ue->code_ue,
            'code_ec' => 'EC' . Str::random(10), // code unique
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->getJson("/api/ec/{$ec->code_ec}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'code_ec',
                         'label_ec',
                         'desc_ec',
                         'nbh_ec',
                         'nbc_ec',
                         'code_ue',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    /** @test */
    public function test_delete_ec()
    {
        $ue = Ue::factory()->create();
        $ec = Ec::factory()->create([
            'code_ue' => $ue->code_ue,
            'code_ec' => 'EC' . Str::random(8), // code unique
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->deleteJson("/api/ec/{$ec->code_ec}");

        $response->assertStatus(200)
                 ->assertJson(['message' => 'EC supprimé avec succès']);
    }
}
