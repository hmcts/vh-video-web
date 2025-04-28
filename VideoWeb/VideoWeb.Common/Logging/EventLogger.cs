namespace VideoWeb.Common.Logging
{
    using System;
    using Microsoft.Extensions.Logging;
    using VideoWeb.Common.Models;

    public static partial class EventLogger
    {
        [LoggerMessage(
            EventId = 5000,
            Level = LogLevel.Debug,
            Message = "ParticipantsUpdated called. ConferenceId: {ConferenceId}, Request {SerializedRequest}")]
        public static partial void LogParticipantsUpdatedCalled(this ILogger logger, Guid conferenceId, string serializedRequest);

        [LoggerMessage(
            EventId = 5001,
            Level = LogLevel.Debug,
            Message = "ParticipantsUpdated finished. ConferenceId: {ConferenceId}")]
        public static partial void LogParticipantsUpdatedFinished(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 5002,
            Level = LogLevel.Error,
            Message = "Error in ParticipantsUpdated. ConferenceId: {ConferenceId}, ErrorCode: {StatusCode}")]
        public static partial void LogParticipantsUpdatedError(this ILogger logger, Guid conferenceId, int statusCode, Exception exception);

        [LoggerMessage(
            EventId = 5003,
            Level = LogLevel.Debug,
            Message = "EndpointsUpdated called. ConferenceId: {ConferenceId}, Request {SerializedRequest}")]
        public static partial void LogEndpointsUpdatedCalled(this ILogger logger, Guid conferenceId, string serializedRequest);

        [LoggerMessage(
            EventId = 5004,
            Level = LogLevel.Debug,
            Message = "EndpointsUpdated finished. ConferenceId: {ConferenceId}")]
        public static partial void LogEndpointsUpdatedFinished(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 5005,
            Level = LogLevel.Error,
            Message = "Error in EndpointsUpdated. ConferenceId: {ConferenceId}, ErrorCode: {StatusCode}")]
        public static partial void LogEndpointsUpdatedError(this ILogger logger, Guid conferenceId, int statusCode, Exception exception);

        [LoggerMessage(
            EventId = 5006,
            Level = LogLevel.Debug,
            Message = "UnlinkedParticipantFromEndpoint called. ConferenceId: {ConferenceId}, Participant {Participant}, Endpoint {Endpoint}")]
        public static partial void LogUnlinkedParticipantFromEndpoint(this ILogger logger, Guid conferenceId, string participant, string endpoint);

        [LoggerMessage(
            EventId = 5007,
            Level = LogLevel.Debug,
            Message = "LinkedNewParticipantToEndpoint called. ConferenceId: {ConferenceId}, Participant {Participant}, Endpoint {Endpoint}")]
        public static partial void LogLinkedNewParticipantToEndpoint(this ILogger logger, Guid conferenceId, string participant, string endpoint);

        [LoggerMessage(
            EventId = 5008,
            Level = LogLevel.Debug,
            Message = "CloseConsultationBetweenEndpointAndParticipant called. ConferenceId: {ConferenceId}, Participant {Participant}, Endpoint {Endpoint}")]
        public static partial void LogCloseConsultationBetweenEndpointAndParticipant(this ILogger logger, Guid conferenceId, string participant, string endpoint);
    
        [LoggerMessage(
            EventId = 5009,
            Level = LogLevel.Trace,
            Message = "Raising video event: ConferenceId: {ConferenceId}, EventType: {EventType}")]
        public static partial void LogRaisingVideoEvent(this ILogger logger, string conferenceId, string eventType);
        
        [LoggerMessage(
            EventId = 5010,
            Level = LogLevel.Trace,
            Message = "Initial conference details: {@Conference}")]
        public static partial void LogRaisingVideoEvent(this ILogger logger, Conference conference);

        [LoggerMessage(
            EventId = 5011,
            Level = LogLevel.Trace,
            Message = "Handling Event: {EventType} for conferenceId {ConferenceId} with reason {Reason}")]
        public static partial void LogHandlingEvent(this ILogger logger, string eventType, Guid conferenceId, string reason);

        [LoggerMessage(
            EventId = 5012,
            Level = LogLevel.Trace,
            Message = "Informing {Username} in conference {ConferenceId} Participant Status: Participant Id: {ParticipantId} | Role: {ParticipantRole} | Participant State: {ParticipantState}")]
        public static partial void LogInformingParticipantStatus(this ILogger logger, string username, Guid conferenceId, Guid participantId, string participantRole, string participantState);

        [LoggerMessage(
            EventId = 5013,
            Level = LogLevel.Trace,
            Message = "Informing Admin for conference {ConferenceId} Participant Status: Participant Id: {ParticipantId} | Role: {ParticipantRole} | Participant State: {ParticipantState}")]
        public static partial void LogInformingAdminParticipantStatus(this ILogger logger, Guid conferenceId, Guid participantId, string participantRole, string participantState);

        [LoggerMessage(
            EventId = 5014,
            Level = LogLevel.Trace,
            Message = "Conference Status: Conference Id: {ConferenceId} | Participant Id: {ParticipantId} | Role: {ParticipantRole} | Participant State: {HearingEventStatus}")]
        public static partial void LogConferenceStatus(this ILogger logger, Guid conferenceId, Guid participantId, string participantRole, string hearingEventStatus);

        [LoggerMessage(
            EventId = 5015,
            Level = LogLevel.Trace,
            Message = "Endpoint Status: Endpoint Id: {EndpointId} | Endpoint State: {EndpointState}")]
        public static partial void LogEndpointStatus(this ILogger logger, Guid endpointId, string endpointState);

        [LoggerMessage(
            EventId = 5016,
            Level = LogLevel.Trace,
            Message = "RoomTransfer sent to group: {Group} | Role: {ParticipantRole}")]
        public static partial void LogRoomTransferToGroup(this ILogger logger, string group, string participantRole);

        [LoggerMessage(
            EventId = 5017,
            Level = LogLevel.Trace,
            Message = "RoomTransfer sent to group: {Group}")]
        public static partial void LogRoomTransferToAdminGroup(this ILogger logger, string group);

        [LoggerMessage(
            EventId = 5018,
            Level = LogLevel.Trace,
            Message = "Participant {ParticipantId} joined conference {ConferenceId} with status {ParticipantStatus}")]
        public static partial void LogRoomTransferToAdminGroup(this ILogger logger, Guid participantId, Guid conferenceId, string participantStatus);

        [LoggerMessage(
            EventId = 5019,
            Level = LogLevel.Trace,
            Message = "Connected to event hub server-side: {Username}")]
        public static partial void LogConnectedToEventHub(this ILogger logger, string username);

        [LoggerMessage(
            EventId = 5020,
            Level = LogLevel.Information,
            Message = "Disconnected from chat hub server-side: {Username}")]
        public static partial void LogDisconnectedFromEventHub(this ILogger logger, string username);

        [LoggerMessage(
            EventId = 5021,
            Level = LogLevel.Error,
            Message = "Error when disconnecting from chat hub server-side: {Username}")]
        public static partial void LogErrorDisconnectingFromEventHub(this ILogger logger, Exception exception, string username);

        [LoggerMessage(
            EventId = 5022,
            Level = LogLevel.Debug,
            Message = "Attempting to send message in conference {ConferenceId}")]
        public static partial void LogAttemptingToSendMessage(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 5023,
            Level = LogLevel.Debug,
            Message = "Admin has responded, notifying admin channel")]
        public static partial void LogAdminResponded(this ILogger logger);

        [LoggerMessage(
            EventId = 5024,
            Level = LogLevel.Debug,
            Message = "Pushing message to Video API history {MessageUuid}")]
        public static partial void LogPushingMessageToHistory(this ILogger logger, Guid messageUuid);

        [LoggerMessage(
            EventId = 5025,
            Level = LogLevel.Error,
            Message = "Error occurred when sending message to {To}, in conference {ConferenceId}")]
        public static partial void LogErrorSendingMessage(this ILogger logger, Exception exception, string to, Guid conferenceId);

        [LoggerMessage(
            EventId = 5026,
            Level = LogLevel.Error,
            Message = "Error occurred when sending heartbeat")]
        public static partial void LogErrorSendingHeartbeat(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 5027,
            Level = LogLevel.Debug,
            Message = "Participant/Endpoint {ParticipantId} does not exist in conference {ConferenceId}")]
        public static partial void LogParticipantOrEndpointNotFound(this ILogger logger, Guid participantId, Guid conferenceId);

        [LoggerMessage(
            EventId = 5028,
            Level = LogLevel.Trace,
            Message = "Participant transfer: Participant Id: {ParticipantId} | Conference Id: {ConferenceId} | Direction: {Direction}")]
        public static partial void LogParticipantTransfer(this ILogger logger, Guid participantId, Guid conferenceId, string direction);

        [LoggerMessage(
            EventId = 5029,
            Level = LogLevel.Error,
            Message = "Error occurred when transferring participant")]
        public static partial void LogErrorTransferringParticipant(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 5031,
            Level = LogLevel.Error,
            Message = "Error occurred when updating participant device status")]
        public static partial void LogErrorUpdatingDeviceStatus(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 5032,
            Level = LogLevel.Trace,
            Message = "Participant remote mute status updated: Participant Id: {ParticipantId} | Conference Id: {ConferenceId} to {IsRemoteMuted}")]
        public static partial void LogParticipantRemoteMuteStatusUpdated(this ILogger logger, Guid participantId, Guid conferenceId, bool isRemoteMuted);

        [LoggerMessage(
            EventId = 5033,
            Level = LogLevel.Error,
            Message = "Error occurred when updating participant remote mute status")]
        public static partial void LogErrorUpdatingRemoteMuteStatus(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 5034,
            Level = LogLevel.Error,
            Message = "Error occurred when updating participant hand status")]
        public static partial void LogErrorUpdatingHandStatus(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 5035,
            Level = LogLevel.Error,
            Message = "Error occurred when updating participant local mute status")]
        public static partial void LogErrorUpdatingLocalMuteStatus(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 5036,
            Level = LogLevel.Error,
            Message = "Error occurred when updating all participants' local mute status")]
        public static partial void LogErrorUpdatingAllLocalMuteStatus(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 5037,
            Level = LogLevel.Error,
            Message = "Error occurred when updating other hosts in conference {ConferenceId}")]
        public static partial void LogErrorUpdatingOtherHosts(this ILogger logger, Exception exception, Guid conferenceId);

        [LoggerMessage(
            EventId = 5038,
            Level = LogLevel.Error,
            Message = "Error occurred when updating hosts in conference {ConferenceId}")]
        public static partial void LogErrorUpdatingHosts(this ILogger logger, Exception exception, Guid conferenceId);

        [LoggerMessage(
            EventId = 5039,
            Level = LogLevel.Error,
            Message = "There was an error when disconnecting from chat hub server-side: {Username}")]
        public static partial void LogErrorDisconnectingFromChatHub(this ILogger logger, Exception exception, string username);

        [LoggerMessage(
            EventId = 5040,
            Level = LogLevel.Error,
            Message = "Error occurred when updating participant {ParticipantId} in conference {ConferenceId} hand status to {IsHandRaised}")]
        public static partial void LogErrorUpdatingParticipantHandStatus(this ILogger logger, Exception exception, Guid participantId, Guid conferenceId, bool isHandRaised);

        [LoggerMessage(
            EventId = 5041,
            Level = LogLevel.Error,
            Message = "Error occurred when updating participant {ParticipantId} in conference {ConferenceId} local mute status to {Muted}")]
        public static partial void LogErrorUpdatingParticipantLocalMuteStatus(this ILogger logger, Exception exception, Guid participantId, Guid conferenceId, bool muted);

        [LoggerMessage(
            EventId = 5042,
            Level = LogLevel.Error,
            Message = "Error occurred when updating participant {ParticipantId} in conference {ConferenceId} remote mute status to {IsRemoteMuted}")]
        public static partial void LogErrorUpdatingParticipantRemoteMuteStatus(this ILogger logger, Exception exception, Guid participantId, Guid conferenceId, bool isRemoteMuted);
        
        [LoggerMessage(
            EventId = 5043,
            Level = LogLevel.Debug,
            Message = "Sending message {MessageUuid} to group {Username}")]
        public static partial void LogSendingMessageToGroup(this ILogger logger, Guid messageUuid, string username);

        [LoggerMessage(
            EventId = 5044,
            Level = LogLevel.Information,
            Message = "Request to {RequestUri}: {RequestBody}")]
        public static partial void LogRequestDetails(this ILogger logger, string requestUri, string requestBody);


    }
}   