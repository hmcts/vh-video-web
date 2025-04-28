namespace VideoWeb.Common.Logging
{
    using System;
    using Microsoft.Extensions.Logging;

    public static partial class ParticipantLogger
    {
        [LoggerMessage(
            EventId = 4000,
            Level = LogLevel.Error,
            Message = "Unable to retrieve conference details")]
        public static partial void LogUnableToRetrieveConferenceDetails(this ILogger logger, Exception exception);

        [LoggerMessage(
            EventId = 4002,
            Level = LogLevel.Trace,
            Message = "Retrieving booking participants for hearing {HearingId}")]
        public static partial void LogRetrievingBookingParticipants(this ILogger logger, Guid hearingId);

        [LoggerMessage(
            EventId = 4003,
            Level = LogLevel.Warning,
            Message = "Staff Member only can view hearing within 30 minutes of the Start time and 2 hours after the hearing has closed")]
        public static partial void LogStaffMemberAccessRestriction(this ILogger logger);

        [LoggerMessage(
            EventId = 4004,
            Level = LogLevel.Debug,
            Message = "Attempting to assign {StaffMember} to conference {ConferenceId}")]
        public static partial void LogAssignStaffMemberToConference(this ILogger logger, string staffMember, Guid conferenceId);
        
        [LoggerMessage(
            EventId = 4005,
            Level = LogLevel.Trace,
            Message = "{UserName} | Role: {Role}")]
        public static partial void LogUserRole(this ILogger logger, string userName, string role);

        [LoggerMessage(
            EventId = 4006,
            Level = LogLevel.Debug,
            Message = "Participant {ParticipantId} does not exist in {ConferenceId}")]
        public static partial void LogParticipantDoesNotExistInConference(this ILogger logger, Guid participantId, Guid conferenceId);

         [LoggerMessage(
            EventId = 4007,
            Level = LogLevel.Trace,
            Message = "Participant device status updated: Participant Id: {ParticipantId} | Conference Id: {ConferenceId}")]
        public static partial void LogParticipantDeviceStatusUpdated(this ILogger logger, Guid participantId, Guid conferenceId);

        [LoggerMessage(
            EventId = 4008,
            Level = LogLevel.Trace,
            Message = "Updating conference in cache: {Conference}")]
        public static partial void LogUpdatingConferenceInCache(this ILogger logger, string conference);
        
        [LoggerMessage(
            EventId = 4009,
            Level = LogLevel.Trace,
            Message = "Participant left conference: Participant Id: {ParticipantId} | Conference Id: {ConferenceId}")]
        public static partial void LogParticipantLeftConference(this ILogger logger, Guid participantId, Guid conferenceId);

    }
}