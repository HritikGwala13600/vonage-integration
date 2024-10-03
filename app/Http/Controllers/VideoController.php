<?php

namespace App\Http\Controllers;

use App\Http\Services\VonageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class VideoController extends Controller
{
    protected $vonageService;

    public function __construct(VonageService $vonageService)
    {
        $this->vonageService = $vonageService;
    }

    public function videoCall(Request $request)
    {
        $sessionId = Cache::get('sessionId');
        if(!$sessionId){
            $sessionId = $this->vonageService->getSessionId();
            Cache::put('sessionId', $sessionId);
        }
        $token = $this->vonageService->generateToken($sessionId);
        $isHost = true; 
        return view('video.video', [
            'sessionId' => $sessionId,
            'token' => $token,
            'isHost' => $isHost,
            'applicationId' => env('APPLICATION_ID')
        ]);
    }

    public function videoCallStatic(){
        $sessionId = Cache::get('sessionId');
        if(!$sessionId){
            $sessionId = $this->vonageService->getSessionId();
            Cache::put('sessionId', $sessionId);
        }
        $token = $this->vonageService->generateToken($sessionId);
        $isHost = true; 
        return view('video.static_video', [
            'sessionId' => $sessionId,
            'token' => $token,
            'isHost' => $isHost,
            'applicationId' => env('APPLICATION_ID')
        ]);
        // return view('video.static_video');
    }

    public function startArchive(Request $request)
    {
        $sessionId = $request->input('sessionId');
        $archive = $this->vonageService->startArchive($sessionId);

        return response()->json(['archiveId' => $archive->getId()]);
    }

    public function stopArchive(Request $request)
    {
        $archiveId = $request->input('archiveId');
        $this->vonageService->stopArchive($archiveId);

        return response()->json(['status' => 'Archive stopped']);
    }

    public function listArchives()
    {
        $archives = $this->vonageService->listArchives();
        return response()->json(["data" => $archives], 200);
    }

    public function resetSession()
    {
        $this->vonageService->resetSession();
        return redirect()->route('video');
    }
}
