$(document).ready(function () {
    // Toggling classes for audio (Mute/Unmute) with jQuery
    $(".audio-toggle").on("click", function () {
        const icon = $(this).find("i");
        if (icon.hasClass("fa-microphone-slash")) {
            icon.removeClass("fa-microphone-slash inactive").addClass(
                "fa-microphone active"
            );
            icon.css("color", "white");
            $(this).html('<i class="fas fa-microphone active"></i> Mute');
        } else {
            icon.removeClass("fa-microphone active").addClass(
                "fa-microphone-slash inactive"
            );
            icon.css("color", "red");
            $(this).html(
                '<i class="fas fa-microphone-slash inactive"></i> Unmute'
            );
        }
    });

    // Toggling classes for video (On/Off) with jQuery
    $(".video-toggle").on("click", function () {
        const icon = $(this).find("i");
        if (icon.hasClass("fa-video")) {
            icon.removeClass("fa-video active").addClass(
                "fa-video-slash inactive"
            );
            icon.css("color", "white");
            $(this).html('<i class="fas fa-video-slash inactive"></i> Video');
        } else {
            icon.removeClass("fa-video-slash inactive").addClass(
                "fa-video active"
            );
            icon.css("color", "red");
            $(this).html('<i class="fas fa-video active"></i> Video');
        }
    });

    // Toggling classes for screen sharing (Share/Stop Share) with jQuery
    $(".share-screen-toggle").on("click", function () {
        const icon = $(this).find("i");
        if (icon.hasClass("fa-share-square")) {
            icon.removeClass("fa-share-square active").addClass(
                "fa-stop-circle inactive"
            );
            icon.css("color", "white");
            $(this).html(
                '<i class="fas fa-stop-circle inactive"></i> Stop Sharing'
            );
        } else {
            icon.removeClass("fa-stop-circle inactive").addClass(
                "fa-share-square active"
            );
            icon.css("color", "red");
            $(this).html(
                '<i class="fas fa-share-square active"></i> Share Screen'
            );
        }
    });

    // Toggling classes for recording (Start/Stop) with jQuery
    $(".record-toggle").on("click", function () {
        const icon = $(this).find("i");
        if (icon.hasClass("fa-record-vinyl")) {
            icon.removeClass("fa-record-vinyl active").addClass(
                "fa-stop-circle inactive"
            );
            icon.css("color", "white");
            $(this).html(
                '<i class="fas fa-stop-circle inactive"></i> Stop Recording'
            );
        } else {
            icon.removeClass("fa-stop-circle inactive").addClass(
                "fa-record-vinyl active"
            );
            icon.css("color", "red");
            $(this).html(
                '<i class="fas fa-record-vinyl active"></i> Start Recording'
            );
        }
    });

    // Toggling between End Meeting and Leave Meeting with jQuery
    $(".meeting-toggle").on("click", function () {
        $(".host-view").toggle();
        $(".participant-view").toggle();
    });

    // Toggling chat panel
    $(".chat-toggle").on("click", function () {
        $("#chat-section").toggleClass("chat-open");
    });

    // Close chat panel
    $(".close-chat").on("click", function () {
        $("#chat-section").removeClass("chat-open");
    });

    // Sending a chat message (Demo)
    $("#send-message").on("click", function () {
        const message = $("#chat-input").val();
        if (message.trim() !== "") {
            $(".chat-messages").append("<p>" + message + "</p>");
            $("#chat-input").val("");
        }
    });

    // Vonage Video Login Start Here....

    let archiveId = null; // Store the archive ID
    let publisher;
    let cameraOn = true;
    let audioOn = true;
    let screenSharingPublisher;
    let screenSharingOn = false;
    let subscriber;
    const session = OT.initSession(apiKey, sessionId);
    let participantCount = 0;
    let meetingStartTime = null;
    let meetingDurationInterval;
    let audioInputDevices;
    let videoInputDevices;

    // AJAX Setup for CSRF
    $.ajaxSetup({
        headers: {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
        },
    });

    // Setting the camera and microphone used by the publisher
    OT.getDevices((error, devices) => {
        console.log("getDevices Called");

        audioInputDevices = devices.filter(
            (device) => device.kind === "audioInput"
        );
        videoInputDevices = devices.filter(
            (device) => device.kind === "videoInput"
        );

        audioInputDevices.forEach((device) => {
            console.log("audio input device: ", device.deviceId);
        });
        videoInputDevices.forEach((device) => {
            console.log("video input device: ", device.deviceId);
        });
    });

    // Connect to session
    session.connect(token, (error) => {
        if (error) {
            console.log("Error connecting:", error.message);
            return;
        }

        const pubOptions = {
            audioSource: audioInputDevices[0].deviceId,
            videoSource: videoInputDevices[0].deviceId,
        };
        // Initialize publisher (camera)
        publisher = OT.initPublisher("publisher", pubOptions, {
            name: "Publisher Name",
            insertMode: "append",
            resolution: "1280x720",
            style: { buttonDisplayMode: "off" },
        });

        session.publish(publisher, (error) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Publishing a stream.");
            }
        });

        // Listen to streamCreated event
        session.on("streamCreated", (event) => {
            console.log(
                `Stream resolution: ${event.stream.videoDimensions.width}x${event.stream.videoDimensions.height}`
            );
            subscriber = session.subscribe(event.stream, "subscriber", {
                insertMode: "append",
                width: "100%",
                height: "100%",
            });
            updateParticipantUI();
        });

        // Detecting when a published stream leaves a session
        publisher.on("streamDestroyed", (event) => {
            console.log(
                "The publisher stopped streaming. Reason: " + event.reason
            );
        });

        // Toggle camera
        $("#toggleCamera").on("click", function () {
            cameraOn = !cameraOn;
            publisher.publishVideo(cameraOn);
            // this.textContent = cameraOn ? "Turn Off Camera" : "Turn On Camera";
        });

        // Toggle audio
        $("#toggleAudio").on("click", function () {
            audioOn = !audioOn;
            publisher.publishAudio(audioOn);
            // this.textContent = audioOn ? "Mute" : "Unmute";
        });

        // Screen sharing
        $("#toggleScreenShare").on("click", function () {
            if (!screenSharingOn) {
                startScreenSharing();
                // this.textContent = "Stop Sharing";
            } else {
                stopScreenSharing();
                // this.textContent = "Share Screen";
            }
        });

        // Start recording
        $("#startRecording").on("click", function () {
            $.ajax({
                url: startRecordingUrl,
                method: "POST",
                data: { sessionId },
                success: (response) => {
                    archiveId = response.archiveId;
                    console.log("Recording started, Archive ID:", archiveId);
                    $(this).hide();
                    // $("#stopRecording").show().prop("disabled", false);
                },
                error: (xhr) => {
                    console.log("Error starting archive:", xhr.responseText);
                },
            });
        });

        // Stop recording
        $("#stopRecording").on("click", function () {
            if (archiveId) {
                $.ajax({
                    url: stopRecordingUrl,
                    method: "POST",
                    data: { archiveId },
                    success: (response) => {
                        console.log("Recording stopped.");
                        $(this).hide();
                        $("#startRecording").show();
                        $(this).prop("disabled", true);
                    },
                    error: (xhr) => {
                        console.log(
                            "Error stopping archive:",
                            xhr.responseText
                        );
                    },
                });
            }
        });

        // Leave meeting
        $("#leaveCall").on("click", function () {
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
    const startScreenSharing = () => {
        screenSharingPublisher = OT.initPublisher("publisher", {
            videoSource: "screen",
        });
        session.publish(screenSharingPublisher);
        screenSharingOn = true;
    };

    const stopScreenSharing = () => {
        if (screenSharingPublisher) {
            session.unpublish(screenSharingPublisher);
            screenSharingPublisher.destroy();
            screenSharingOn = false;
        }
    };

    // Update UI for participants
    const updateParticipantUI = () => {
        participantCount += 1;
        const videoContainer = $("#videos");
        if (participantCount > 1) {
            videoContainer.css(
                "grid-template-columns",
                `repeat(${participantCount}, 1fr)`
            );
        } else {
            videoContainer.css("grid-template-columns", "1fr");
        }
    };

    // Update meeting duration
    const updateMeetingDuration = () => {
        const currentTime = new Date();
        const durationInSeconds = Math.floor(
            (currentTime - meetingStartTime) / 1000
        );
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;
        $("#meetingDuration").text(`${minutes}m ${seconds}s`);
    };
});
