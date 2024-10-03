<?php

namespace App\Http\Services;

use Vonage\Client;
use Vonage\Client\Credentials\Keypair;
use Illuminate\Support\Facades\Cache;
use Vonage\Video\SessionOptions;
use Vonage\Video\Archive\ArchiveConfig;

class VonageService
{
    protected $client;

    public function __construct()
    {
        $credentials = new Keypair(
            file_get_contents(base_path('private_key.key')), 
            '013f2368-014c-4b83-aabe-f51e8a074df1'
        );
        $options = ['base_video_url' => 'http://127.0.0.1:8000'];
        $this->client = new Client($credentials, $options);
    }

    public function getSessionId()
    {
        // Check for cached session
        $sessionId = Cache::get('vonage_session_id');
        if (!$sessionId) {
            // Create new session if not in cache
            $session = $this->client->video()->createSession(new SessionOptions());
            $sessionId = $session->getSessionId();
            Cache::put('vonage_session_id', $sessionId, 60 * 60); // Cache for 1 hour
        }
        return $sessionId;
    }

    public function generateToken($sessionId)
    {
        return $this->client->video()->generateClientToken($sessionId);
    }

    public function startArchive($sessionId)
    {
        $archiveConfig = new ArchiveConfig($sessionId, [
            'name' => 'Test Video Call Archive',
            'outputMode' => ArchiveConfig::OUTPUT_MODE_COMPOSED
        ]);
        return $this->client->video()->startArchive($archiveConfig);
    }

    public function stopArchive($archiveId)
    {
        return $this->client->video()->stopArchive($archiveId);
    }

    public function listArchives()
    {
        return $this->client->video()->listArchives();
    }

    public function resetSession()
    {
        Cache::forget('vonage_session_id');
    }
}
