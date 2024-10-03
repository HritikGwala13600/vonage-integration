var archiveId = null; // Store the archive ID
var publisher;
var cameraOn = true;
var audioOn = true;
var screenSharingPublisher;
var screenSharingOn = false;
var subscriber;
var session = OT.initSession(apiKey, sessionId);
var participantCount = 0;
var meetingStartTime = null;
var meetingDurationInterval;
var audioInputDevices;
var videoInputDevices;

// AJAX Setup for CSRF
$.ajaxSetup({
    headers: {
        "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
    },
});

// Setting the camera and microphone used by the publisher
OT.getDevices(function (error, devices) {
    console.log("getDevices Called");

    audioInputDevices = devices.filter(function (element) {
        return element.kind == "audioInput";
    });
    videoInputDevices = devices.filter(function (element) {
        return element.kind == "videoInput";
    });
    for (var i = 0; i < audioInputDevices.length; i++) {
        console.log("audio input device: ", audioInputDevices[i].deviceId);
    }
    for (i = 0; i < videoInputDevices.length; i++) {
        console.log("video input device: ", videoInputDevices[i].deviceId);
    }
});

// Connect to session
session.connect(token, function (error) {
    if (error) {
        console.log("Error connecting:", error.message);
        return;
    }

    let pubOptions = {
        audioSource: audioInputDevices[0].deviceId,
        videoSource: videoInputDevices[0].deviceId,
    };
    // Initialize publisher (camera)
    publisher = OT.initPublisher("publisher", pubOptions, {
        name: "Publisher Name",
        insertMode: "append",
        resolution: '1280x720',
        // width: "100%",
        // height: "100%",
        style: { buttonDisplayMode: "off" },
    });

    session.publish(publisher, function (error) {
        if (error) {
            console.log(error);
        } else {
            console.log("Publishing a stream.");
        }
    });

    // Listen to streamCreated event
    session.on("streamCreated", function (event) {
        console.log(
            "Stream resolution: " +
                event.stream.videoDimensions.width +
                "x" +
                event.stream.videoDimensions.height
        );
        subscriber = session.subscribe(event.stream, "subscriber", {
            insertMode: "append",
            width: "100%",
            height: "100%",
        });
        updateParticipantUI();
    });

    // Detecting when a published stream leaves a session
    publisher.on("streamDestroyed", function (event) {
        console.log("The publisher stopped streaming. Reason: " + event.reason);
    });

    // Toggle camera
    document
        .getElementById("toggleCamera")
        .addEventListener("click", function () {
            cameraOn = !cameraOn;
            publisher.publishVideo(cameraOn);
            this.textContent = cameraOn ? "Turn Off Camera" : "Turn On Camera";
        });

    // Toggle audio
    document
        .getElementById("toggleAudio")
        .addEventListener("click", function () {
            audioOn = !audioOn;
            publisher.publishAudio(audioOn);
            this.textContent = audioOn ? "Mute" : "Unmute";
        });

    // Screen sharing
    document
        .getElementById("toggleScreenShare")
        .addEventListener("click", function () {
            if (!screenSharingOn) {
                startScreenSharing();
                this.textContent = "Stop Sharing";
            } else {
                stopScreenSharing();
                this.textContent = "Share Screen";
            }
        });

    // Start recording
    document
        .getElementById("startRecording")
        .addEventListener("click", function () {
            $.ajax({
                url: startRecordingUrl,
                method: "POST",
                data: { sessionId },
                success(response) {
                    archiveId = response.archiveId;
                    console.log("Recording started, Archive ID:", archiveId);
                    this.style.display = "none";
                    document.getElementById("stopRecording").style.display =
                        "inline";
                    document.getElementById("stopRecording").disabled = false;
                },
                error(xhr) {
                    console.log("Error starting archive:", xhr.responseText);
                },
            });
        });

    // Stop recording
    document
        .getElementById("stopRecording")
        .addEventListener("click", function () {
            if (archiveId) {
                $.ajax({
                    url: stopRecordingUrl,
                    method: "POST",
                    data: { archiveId },
                    success(response) {
                        console.log("Recording stopped.");
                        this.style.display = "none";
                        document.getElementById(
                            "startRecording"
                        ).style.display = "inline";
                        document.getElementById(
                            "stopRecording"
                        ).disabled = true;
                    },
                    error(xhr) {
                        console.log(
                            "Error stopping archive:",
                            xhr.responseText
                        );
                    },
                });
            }
        });

    // Leave meeting
    document.getElementById("leaveCall").addEventListener("click", function () {
        // session.disconnect();
        // clearInterval(meetingDurationInterval);
        // alert("You have left the meeting.");
        // location.reload(); // Reload to reset UI after leaving
        // window.location.href = homePageUrl;
    });

    // Start meeting duration timer
    meetingStartTime = new Date();
    meetingDurationInterval = setInterval(updateMeetingDuration, 1000);
});

// Screen sharing functions
function startScreenSharing() {
    screenSharingPublisher = OT.initPublisher("publisher", {
        videoSource: "screen",
    });
    session.publish(screenSharingPublisher);
    screenSharingOn = true;
}

function stopScreenSharing() {
    if (screenSharingPublisher) {
        session.unpublish(screenSharingPublisher);
        screenSharingPublisher.destroy();
        screenSharingOn = false;
    }
}

// Update UI for participants
function updateParticipantUI() {
    participantCount += 1;
    var videoContainer = document.getElementById("videos");
    if (participantCount > 1) {
        videoContainer.style.gridTemplateColumns = `repeat(${participantCount}, 1fr)`;
    } else {
        videoContainer.style.gridTemplateColumns = "1fr";
    }
}

// Update meeting duration
function updateMeetingDuration() {
    var currentTime = new Date();
    var durationInSeconds = Math.floor((currentTime - meetingStartTime) / 1000);
    var minutes = Math.floor(durationInSeconds / 60);
    var seconds = durationInSeconds % 60;
    document.getElementById(
        "meetingDuration"
    ).textContent = `${minutes}m ${seconds}s`;
}
