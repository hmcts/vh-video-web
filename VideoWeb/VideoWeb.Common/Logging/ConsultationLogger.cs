namespace VideoWeb.Common.Logging
{
    using System;
    using Microsoft.Extensions.Logging;

    public static partial class ConsultationLogger
    {
        [LoggerMessage(
            EventId = 2000,
            Level = LogLevel.Error,
            Message = "Consultation request could not be responded to")]
        public static partial void LogConsultationResponseError(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 2001,
            Level = LogLevel.Trace,
            Message = "Attempting to join a private consultation {ConferenceId} {ParticipantId} {RoomLabel}")]
        public static partial void LogAttemptingToJoinPrivateConsultation(this ILogger logger, Guid conferenceId, Guid participantId, string roomLabel);

        [LoggerMessage(
            EventId = 2002,
            Level = LogLevel.Warning,
            Message = "Couldn't join private consultation. Couldn't find participant. {ConferenceId} {ParticipantId} {RoomLabel}")]
        public static partial void LogParticipantNotFoundForConsultation(this ILogger logger, Guid conferenceId, Guid participantId, string roomLabel);

        [LoggerMessage(
            EventId = 2003,
            Level = LogLevel.Error,
            Message = "Join private consultation error {ConferenceId} {ParticipantId} {RoomLabel}")]
        public static partial void LogJoinPrivateConsultationError(this ILogger logger, Exception exception, Guid conferenceId, Guid participantId, string roomLabel);

        [LoggerMessage(
            EventId = 2004,
            Level = LogLevel.Warning,
            Message = "The participant with Id: {RequestedBy} and username: {Username} is not found")]
        public static partial void LogParticipantNotFound(this ILogger logger, Guid requestedBy, string username);

        [LoggerMessage(
            EventId = 2005,
            Level = LogLevel.Error,
            Message = "Start consultation error Conference")]
        public static partial void LogStartConsultationError(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 2006,
            Level = LogLevel.Error,
            Message = "Could not update the lock state of the consultation room")]
        public static partial void LogLockConsultationRoomError(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 2007,
            Level = LogLevel.Error,
            Message = "Join endpoint to consultation error")]
        public static partial void LogJoinEndpointToConsultationError(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 2008,
            Level = LogLevel.Error,
            Message = "Unable to add {EndpointId} to consultation")]
        public static partial void LogUnableToAddEndpointToConsultation(this ILogger logger, Exception exception, Guid endpointId);

        [LoggerMessage(
            EventId = 2009,
            Level = LogLevel.Error,
            Message = "Participant: {Username} was not able to leave the private consultation. An error occurred")]
        public static partial void LogLeaveConsultationError(this ILogger logger, Exception exception, string username);

        [LoggerMessage(
            EventId = 2010,
            Level = LogLevel.Error,
            Message = "Invalid participant")]
        public static partial void LogInvalidParticipant(this ILogger logger, Exception exception);
        
    }
}