namespace VideoWeb.Common.Logging
{
    using System;
    using Microsoft.Extensions.Logging;

    public static partial class HearingLogger
    {
        [LoggerMessage(
            EventId = 6000,
            Level = LogLevel.Information,
            Message = "Attempting to change layout for {ConferenceId} to {NewLayout} by participant with the ID {ChangedById}")]
        public static partial void LogAttemptingToChangeLayout(this ILogger logger, Guid conferenceId, string newLayout, Guid changedById);

        [LoggerMessage(
            EventId = 6001,
            Level = LogLevel.Debug,
            Message = "Got old layout {OldLayout} for {ConferenceId} requested by participant with the ID {ChangedById}")]
        public static partial void LogGotOldLayout(this ILogger logger, string oldLayout, Guid conferenceId, Guid changedById);

        [LoggerMessage(
            EventId = 6002,
            Level = LogLevel.Trace,
            Message = "Sending message to {Hosts} for layout change in {ConferenceId} requested by participant with the ID {ChangedById}")]
        public static partial void LogSendingMessageToHosts(this ILogger logger, string[] hosts, Guid conferenceId, Guid changedById);

        [LoggerMessage(
            EventId = 6003,
            Level = LogLevel.Trace,
            Message = "Hearing layout changed for {ConferenceId} from {OldLayout} to {NewLayout} by participant with the ID {ChangedById}")]
        public static partial void LogHearingLayoutChanged(this ILogger logger, Guid conferenceId, string oldLayout, string newLayout, Guid changedById);

        [LoggerMessage(
            EventId = 6004,
            Level = LogLevel.Error,
            Message = "Error occurred while getting current layout for conference {ConferenceId}")]
        public static partial void LogErrorGettingCurrentLayout(this ILogger logger, Guid conferenceId, Exception exception);
    
        [LoggerMessage(
            EventId = 6005,
            Level = LogLevel.Warning,
            Message = "{ClassName} - Conference with id:'{ConferenceId}' not found.")]
        public static partial void LogConferenceNotFound(this ILogger logger, string className, Guid conferenceId);

        [LoggerMessage(
            EventId = 6006,
            Level = LogLevel.Warning,
            Message = "{ClassName} - User does not belong to this conference.")]
        public static partial void LogUnauthorizedAccess(this ILogger logger, string className);
    }
}