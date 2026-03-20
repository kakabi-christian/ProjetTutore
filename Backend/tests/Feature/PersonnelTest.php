<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Personnel;
use Illuminate\Support\Str;
use Tests\Traits\ApiTokenTrait;

class PersonnelTest extends TestCase
{
    use ApiTokenTrait;

    /** @test */
    public function test_create_personnel()
    {
        $personnelData = Personnel::factory()->make()->toArray();

        // Générer dynamiquement les champs uniques
        $personnelData['code_pers']  = 'PERS' . Str::random(5);
        $personnelData['phone_pers'] = '+237' . rand(600000000, 699999999);
        $personnelData['login_pers'] = 'user' . Str::random(5) . '@example.com';
        $personnelData['pwd_pers']   = 'password123'; // mot de passe clair pour le test

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->postJson('/api/personnels', $personnelData);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'id',
                         'code_pers',
                         'nom_pers',
                         'sexe_pers',
                         'phone_pers',
                         'login_pers',
                         'pwd_pers',
                         'type_pers',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    /** @test */
    public function test_update_personnel()
    {
        $personnel = Personnel::factory()->create([
            'code_pers'  => 'PERS' . Str::random(5),
            'phone_pers' => '+237' . rand(600000000, 699999999),
            'login_pers' => 'user' . Str::random(5) . '@example.com',
        ]);

        $updateData = [
            'nom_pers'  => 'Nom' . Str::random(5),
            'sexe_pers' => 'Feminin',
            'type_pers' => 'Utilisateur',
        ];

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->putJson("/api/personnels/{$personnel->id}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonFragment($updateData);
    }

    /** @test */
    public function test_show_personnel()
    {
        $personnel = Personnel::factory()->create([
            'code_pers'  => 'PERS' . Str::random(5),
            'phone_pers' => '+237' . rand(600000000, 699999999),
            'login_pers' => 'user' . Str::random(5) . '@example.com',
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->getJson("/api/personnels/{$personnel->id}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'code_pers',
                         'nom_pers',
                         'sexe_pers',
                         'phone_pers',
                         'login_pers',
                         'pwd_pers',
                         'type_pers',
                         'created_at',
                         'updated_at',
                     ]
                 ]);
    }

    /** @test */
    public function test_delete_personnel()
    {
        $personnel = Personnel::factory()->create([
            'code_pers'  => 'PERS' . Str::random(5),
            'phone_pers' => '+237' . rand(600000000, 699999999),
            'login_pers' => 'user' . Str::random(5) . '@example.com',
        ]);

        $response = $this->withHeaders($this->withApiTokenHeaders())
                         ->deleteJson("/api/personnels/{$personnel->id}");

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Personnel supprimé avec succès']);
    }
}
