<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="Vonage Video Call Application">
    <link rel="icon" href="https://st1.zoom.us/zoom.ico">
    <link rel="stylesheet" href="{{ asset('css/static_video.css') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700;900&display=swap" rel="stylesheet">
    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.css'
        integrity='sha512-4wfcoXlib1Aq0mUtsLLM74SZtmB73VHTafZAvxIp/Wk9u1PpIsrfmTvK0+yKetghCL8SHlZbMyEcV8Z21v42UQ=='
        crossorigin='anonymous' />
    <title>Vonage Video Calling</title>
</head>

<body>
    <div class="wrapper">
        <header class="topbar">
            <div id="speaker-view" class="m5">
                <a href="#"><i class="fas fa-th"></i>Speaker View</a>
            </div>
        </header>
        <main>
            <div class="scroll-bar">
                <div class="webcam-grid" id="videos">
                    <div id="subscriber"></div>
                    <div id="publisher"></div>
                    {{-- <div id="screenPublisher"></div> --}}
                </div>
            </div>
        </main>

        <div id="chat-section" class="chat-section">
            <div class="chat-header">
                <h2>Chat</h2>
                <a href="#" class="close-chat"><i class="fas fa-times"></i></a>
            </div>
            <div class="chat-body">
                <div class="chat-messages"></div>
            </div>
            <div class="chat-footer">
                <input type="text" id="chat-input" placeholder="Type your message">
                <button id="send-message"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>

        <footer id="navbar">
            <nav>
                <ul>
                    <li id="toggleAudio"><a href="javascript:void(0)" class="audio-toggle"><i class="fas fa-microphone active"></i>Mute</a></li>
                    <li id="toggleCamera"><a href="javascript:void(0)" class="video-toggle"><i class="fas fa-video active"></i>Video</a></li>
                </ul>
                <ul>
                    {{-- <li id="toggleScreenShare"><a href="javascript:void(0)" class="share-screen-toggle"><i class="fas fa-share-square active"></i>Share Screen</a></li> --}}
                    {{-- <li id="startRecording"><a href="javascript:void(0)" class="record-toggle"><i class="fas fa-record-vinyl active"></i>Start Recording</a></li> --}}
                    <li><a href="javascript:void(0)" class="chat-toggle"><i class="fas fa-comment"></i>Chat</a></li>
                </ul>
                <ul class="exit-meeting">
                    <li id="leaveCall">
                        <a href="javascript:void(0)" class="meeting-toggle">
                            <span class="host-view end-meeting" style="display: {{ (auth()->user()->role == 1) ? 'block' : 'none' }};">
                            {{-- <span class="host-view end-meeting" style="display: 'block' }};"> --}}
                                <i class="fas fa-times-circle"></i> End Meeting
                            </span>
                            <span class="participant-view leave-meeting" style="display: {{ (auth()->user()->role == 0) ? 'block' : 'none' }};">
                            {{-- <span class="participant-view leave-meeting" style="display:block;}};"> --}}
                                <i class="fas fa-sign-out-alt"></i> Leave Meeting
                            </span>
                        </a>
                    </li>
                </ul>
            </nav>
        </footer>

    </div>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="https://unpkg.com/@vonage/client-sdk-video@2/dist/js/opentok.js"></script>
    <script>
        var apiKey = "{{ $applicationId }}";
        var sessionId = "{{ $sessionId }}";
        var token = "{{ $token }}";
        var stopRecordingUrl = "{{route('stop-archive')}}";
        var startRecordingUrl = "{{route('start-archive')}}";
        var homePageUrl = "{{route('dashboard')}}";
        let isHost = "{{ (auth()->user()->role == 1) ? true : false  }}"
        let participantProfilePic = "{{ asset('images/cat.jpeg') }}";
        let participantName = "{{auth()->user()->name ?? ''}}"
    </script>

    <script src="{{asset('js/video_static.js')}}"></script>
</body>

</html>
