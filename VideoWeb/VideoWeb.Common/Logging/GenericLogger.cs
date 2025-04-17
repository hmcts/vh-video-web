namespace VideoWeb.Common.Logging
{
    using System;
    using Microsoft.Extensions.Logging;

    public static partial class GenericLogger
    {
        [LoggerMessage(
            EventId = 3000,
            Level = LogLevel.Debug,
            Message = "Getting all active conferences")]
        public static partial void LogGettingActiveConferences(this ILogger logger);

        [LoggerMessage(
            EventId = 3001,
            Level = LogLevel.Error,
            Message = "Unable to get active conferences")]
        public static partial void LogUnableToGetActiveConferences(this ILogger logger, Exception exception);
    
        [LoggerMessage(
            EventId = 3002,
            Level = LogLevel.Debug,
            Message = "GetVenues")]
        public static partial void LogGetVenues(this ILogger logger);
    
        [LoggerMessage(
            EventId = 3003,
            Level = LogLevel.Debug,
            Message = "Starting request")]
        public static partial void LogStartingRequest(this ILogger logger);

        [LoggerMessage(
            EventId = 3004,
            Level = LogLevel.Error,
            Message = "An error occurred: {Message}")]
        public static partial void LogRequestError(this ILogger logger, Exception exception, string message);

        [LoggerMessage(
            EventId = 3005,
            Level = LogLevel.Debug,
            Message = "Handled request in {ElapsedMilliseconds}ms")]
        public static partial void LogHandledRequest(this ILogger logger, long elapsedMilliseconds);

         [LoggerMessage(
            EventId = 3006,
            Level = LogLevel.Debug,
            Message = "GetMessages for {ConferenceId}")]
        public static partial void LogGetMessagesForConference(this ILogger logger, Guid conferenceId);
    }
}