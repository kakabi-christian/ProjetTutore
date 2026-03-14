<?php

namespace Tests\Traits;

trait ApiTokenTrait
{
    protected function getApiToken(): string
    {
        return '5|MimisxjSGNdVVKTgYj5ANaQBfCFMIF5kHaf6L5eD6be86a34';
    }

    protected function withApiTokenHeaders(array $additionalHeaders = []): array
    {
        return array_merge($additionalHeaders, [
            'Authorization' => 'Bearer ' . $this->getApiToken(),
        ]);
    }
}
//tests/Traits/ApiTokenTrait.php