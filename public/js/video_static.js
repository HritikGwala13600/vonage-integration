$(document).ready(function () {
    let archiveId = null;
    let publisher;
    let cameraOn = true;
    let audioOn = true;
    let screenSharingPublisher;
    let screenSharingOn = false;
    let subscriber;
    const session = OT.initSession(apiKey, sessionId);
    let participantCount = 1;
    let meetingStartTime = null;
    let meetingDurationInterval;
    let audioInputDevices;
    let videoInputDevices;

    if (!participantName || participantName == '') {
        participantName = prompt("Enter your name to join the meeting:") || "Anonymous";
    }

    // In-memory chat history (temporary storage)
    let chatHistory = [];

    // Flag to track if the message is sent by the local user
    let isLocalMessage = false;

    // AJAX Setup for CSRF
    $.ajaxSetup({
        headers: {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
        },
    });

    // Toggle Audio (Mute/Unmute)
    $(".audio-toggle").on("click", function () {
        if (!publisher) return;
        const icon = $(this).find("i");
        audioOn = !audioOn;
        publisher.publishAudio(audioOn);
        icon.toggleClass("fa-microphone-slash fa-microphone");
        $(this).html(
            audioOn
                ? '<i class="fas fa-microphone active"></i> Mute'
                : '<i class="fas fa-microphone-slash inactive"></i> Unmute'
        );
    });

    // Toggle Video (On/Off)
    $(".video-toggle").on("click", function () {
        if (!publisher) return;
        const icon = $(this).find("i");
        cameraOn = !cameraOn;
        publisher.publishVideo(cameraOn);
        icon.toggleClass("fa-video-slash fa-video");
        $(this).html(
            cameraOn
                ? '<i class="fas fa-video active"></i> Video'
                : '<i class="fas fa-video-slash inactive"></i> Video'
        );
    });

    // Screen Sharing Toggle
    $(".share-screen-toggle").on("click", function () {
        const icon = $(this).find("i");
        if (!screenSharingOn) {
            startScreenSharing();
        } else {
            stopScreenSharing();
        }
        icon.toggleClass("fa-stop-circle fa-share-square");
        $(this).html(
            screenSharingOn
                ? '<i class="fas fa-stop-circle"></i> Stop Sharing'
                : '<i class="fas fa-share-square"></i> Share Screen'
        );
    });

    // Handle Leave Meeting (For Participants or Host Leaving)
    $(".leave-meeting").on("click", function () {
        if (!isHost) {
            if (confirm("Are you sure you want to leave the meeting?")) {
                session.disconnect(); // Disconnect only this participant
                window.location.href = homePageUrl; // Redirect participant to home page
            }
        }
    });
    // Handle End Meeting (Only for Host)
    $(".end-meeting").on("click", function () {
        if (isHost) {
            if (confirm("Are you sure you want to end the meeting for everyone?")) {
                // Send a signal to all participants to disconnect
                session.signal({
                    type: "endMeeting",
                    data: "The host has ended the meeting."
                }, function (error) {
                    if (error) {
                        console.log("Error sending signal:", error.name, error.message);
                    } else {
                        session.disconnect(); // Disconnect host
                        window.location.href = homePageUrl; // Redirect host to home page
                    }
                });
            }
        }
    });

    // Connect to the session
    session.connect(token, (error) => {
        if (error) {
            console.log("Error connecting:", error.message);
            return;
        }

        OT.getDevices((error, devices) => {
            audioInputDevices = devices.filter(
                (device) => device.kind === "audioInput"
            );
            videoInputDevices = devices.filter(
                (device) => device.kind === "videoInput"
            );

            const pubOptions = {
                audioSource: audioInputDevices[0]?.deviceId,
                videoSource: videoInputDevices[0]?.deviceId,
                name: participantName,
                insertMode: "append",
                width: "100%",
                height: "100%",
                style: { buttonDisplayMode: "off" },
            };

            publisher = OT.initPublisher("publisher", pubOptions);
            session.publish(publisher, (error) => {
                if (error) console.log(error);
            });

            // loadChatHistory(); // Load chat history for newly connected participants
        });

        // Listen to streamCreated event for participants and screen sharing
        session.on("streamCreated", (event) => {
            subscriber = session.subscribe(event.stream, "subscriber", {
                insertMode: "append",
                width: "100%",
                height: "100%",
            });
            updateParticipantUI();
        });

        // Detecting when a published stream leaves a session
        publisher?.on("streamDestroyed", (event) => {
            console.log(
                "The publisher stopped streaming. Reason: " + event.reason
            );
        });

         // Listen for the 'endMeeting' signal from the host
         session.on("signal:endMeeting", function (event) {
            alert(event.data); // Show the message from the host
            session.disconnect(); // Disconnect participant
            window.location.href = homePageUrl; // Redirect to home page after disconnect
        });

        // Chat message handling
        $("#send-message")
            .off("click")
            .on("click", function () {
                const message = $("#chat-input").val();

                if (message.trim() !== "") {
                    const chatData = {
                        name: participantName,
                        message: message,
                        profilePic: participantProfilePic,
                        timestamp: new Date().toLocaleTimeString(),
                    };

                    // Mark as local message
                    isLocalMessage = true;

                    // Send chat message via Vonage signal
                    session.signal(
                        {
                            type: "chat",
                            data: JSON.stringify(chatData),
                        },
                        function (error) {
                            if (error) {
                                console.log(
                                    "Error sending signal:",
                                    error.message
                                );
                            }
                        }
                    );

                    // Append the message locally immediately
                    appendChatMessage(chatData);

                    // Clear the input after sending
                    $("#chat-input").val("");
                }
            });

        // Receiving chat messages
        session.on("signal:chat", function (event) {
            try {
                const chatData = JSON.parse(event.data);

                // Only append if the message was not sent by the local user
                if (!isLocalMessage) {
                    appendChatMessage(chatData);
                }

                // Reset local message flag
                isLocalMessage = false;

                chatHistory.push(chatData);
            } catch (error) {
                console.error("Error parsing chat data:", error);
            }
        });

        // Host-only functionality: End meeting
        if (isHost) {
            $("#leaveCall").on("click", function () {
                session.disconnect();
                alert("Meeting ended by the host.");
                window.location.href = homePageUrl;
            });
        }

        // Start meeting duration timer
        meetingStartTime = new Date();
        meetingDurationInterval = setInterval(updateMeetingDuration, 1000);
    });

    // Start screen sharing
    const startScreenSharing = () => {
        if (screenSharingPublisher) return;

        screenSharingPublisher = OT.initPublisher("screenPublisher", {
            videoSource: "screen",
        });

        session.publish(screenSharingPublisher, (error) => {
            if (error) {
                console.log("Error starting screen sharing:", error.message);
                stopScreenSharing(); // Ensure cleanup on error
            }
        });

        screenSharingOn = true;
    };

    // Stop screen sharing
    const stopScreenSharing = () => {
        if (screenSharingPublisher) {
            session.unpublish(screenSharingPublisher);
            screenSharingPublisher.destroy();
            screenSharingPublisher = null;
            screenSharingOn = false;
        }
    };

    // Append chat message to UI
    const appendChatMessage = (chatData) => {
        const senderName = chatData.name || "Anonymous";
        const senderMessage = chatData.message || "";
        const senderProfilePic =
            chatData.profilePic || "https://example.com/default-avatar.png";

        $(".chat-messages").append(`
            <div class="chat-message">
                <img src="${senderProfilePic}" alt="Profile Picture" class="chat-profile-pic">
                <div class="chat-message-content">
                    <strong>${senderName}:</strong> ${senderMessage} <span class="timestamp">(${chatData.timestamp})</span>
                </div>
            </div>
        `);
    };

    // Update participant UI
    const updateParticipantUI = () => {
        participantCount += 1;
        const videoContainer = $("#videos");
        videoContainer.css(
            "grid-template-columns",
            `repeat(${participantCount}, 1fr)`
        );
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

    // Toggling chat panel
    $(".chat-toggle").on("click", function () {
        $("#chat-section").toggleClass("chat-open");
    });

    // Close chat panel
    $(".close-chat").on("click", function () {
        $("#chat-section").removeClass("chat-open");
    });

    // --- Speaker View Handling ---
    let inSpeakerView = false;

    $("#speaker-view").on("click", function () {
        if (!inSpeakerView) {
            switchToSpeakerView();
        } else {
            switchToGridView();
        }
        inSpeakerView = !inSpeakerView;
    });

    const switchToSpeakerView = () => {
        $("#publisher").css({
            width: "100%",
            height: "100%",
            gridColumn: "span 3",
        });
        $("#subscriber").hide(); // Hide other participants
        $("#speaker-view").html('<i class="fas fa-th"></i> Grid View');
    };

    const switchToGridView = () => {
        $("#publisher").css({
            width: "100%",
            height: "100%",
            gridColumn: "span 1",
        });
        $("#subscriber").show(); // Show other participants
        $("#speaker-view").html('<i class="fas fa-th"></i> Speaker View');
    };
});
