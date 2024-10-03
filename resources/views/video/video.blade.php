<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Video Call</title>
    <link rel="stylesheet" type="text/css" href="{{asset('css/app.css')}}">
</head>

<body>
    <div id="videos">
        <div id="subscriber"></div>
        <div id="publisher"></div>
    </div>

    <div id="controls">
        <button id="toggleCamera">Turn Off Camera</button>
        <button id="toggleAudio">Mute</button>
        <button id="toggleScreenShare">Share Screen</button>
        <button id="startRecording">Start Recording</button>
        <button id="stopRecording" style="display:none;" disabled>Stop Recording</button>
        <button id="leaveCall">Leave Meeting</button>
    </div>
    <div id="meetingDuration" style="margin-top: 20px;">Duration: 0m 0s</div>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="https://unpkg.com/@vonage/client-sdk-video@2/dist/js/opentok.js"></script>

    <script>
        var apiKey = "{{ $applicationId }}";
        var sessionId = "{{ $sessionId }}";
        var token = "{{ $token }}";
        var stopRecordingUrl = "{{route('stop-archive')}}";
        var startRecordingUrl = "{{route('start-archive')}}";
        var homePageUrl = "{{route('dashboard')}}";
    </script>

    <script src="{{asset('js/app.js')}}"></script>
</body>

</html>