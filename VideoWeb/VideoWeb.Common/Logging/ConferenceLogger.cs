namespace VideoWeb.Common.Logging
{
    using System;
    using System.Collections.Generic;
    using Microsoft.Extensions.Logging;

    public static partial class ConferenceLogger
    {
        [LoggerMessage(
            EventId = 1000,
            Level = LogLevel.Debug,
            Message = "Sent request to start / resume conference {ConferenceId}")]
        public static partial void LogStartOrResumeConference(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1001,
            Level = LogLevel.Debug,
            Message = "Getting the layout for {ConferenceId}")]
        public static partial void LogGettingLayout(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1002,
            Level = LogLevel.Warning,
            Message = "Layout didn't have a value returning NotFound. This was for {ConferenceId}")]
        public static partial void LogLayoutNotFound(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1003,
            Level = LogLevel.Debug,
            Message = "Attempting to update layout to {Layout} for conference {ConferenceId}")]
        public static partial void LogUpdateLayout(this ILogger logger, string layout, Guid conferenceId);

        [LoggerMessage(
            EventId = 1004,
            Level = LogLevel.Warning,
            Message = "Could not update layout to {Layout} for hearing as participant with the name {Username} was not found in conference {ConferenceId}")]
        public static partial void LogParticipantNotFound(this ILogger logger, string layout, string username, Guid conferenceId);

        [LoggerMessage(
            EventId = 1005,
            Level = LogLevel.Information,
            Message = "Updated layout to {Layout} for conference {ConferenceId}")]
        public static partial void LogLayoutUpdated(this ILogger logger, string layout, Guid conferenceId);

        [LoggerMessage(
            EventId = 1006,
            Level = LogLevel.Debug,
            Message = "Sent request to pause conference {ConferenceId}")]
        public static partial void LogPauseConference(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1007,
            Level = LogLevel.Debug,
            Message = "Sent request to suspend conference {ConferenceId}")]
        public static partial void LogSuspendConference(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1008,
            Level = LogLevel.Debug,
            Message = "Sent request to end conference {ConferenceId}")]
        public static partial void LogEndConference(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1009,
            Level = LogLevel.Debug,
            Message = "Attempting to get recommended layout for conference {ConferenceId}")]
        public static partial void LogGetRecommendedLayout(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1010,
            Level = LogLevel.Warning,
            Message = "Participant/Endpoint {ParticipantId} is not a callable participant in {ConferenceId}")]
        public static partial void LogParticipantNotCallable(this ILogger logger, Guid participantId, Guid conferenceId);

        [LoggerMessage(
            EventId = 1011,
            Level = LogLevel.Debug,
            Message = "Sending alert to VHO: participant {ParticipantId} dismissed from video hearing {ConferenceId}")]
        public static partial void LogParticipantDismissed(this ILogger logger, Guid participantId, Guid conferenceId);
        
        [LoggerMessage(
            EventId = 1012,
            Level = LogLevel.Warning,
            Message = "{JudgeRole} or {StaffMember} may control hearings")]
        public static partial void LogParticipantDismissed(this ILogger logger, string judgeRole, string staffMember);

        [LoggerMessage(
            EventId = 1013,
            Level = LogLevel.Trace,
            Message = "Got Layout ({Layout}) for {ConferenceId}")]
        public static partial void LogParticipantDismissed(this ILogger logger, string layout, Guid conferenceId);

        [LoggerMessage(
            EventId = 1014,
            Level = LogLevel.Debug,
            Message = "GetConferencesForHost")]
        public static partial void LogGetConferencesForHost(this ILogger logger);

        [LoggerMessage(
            EventId = 1015,
            Level = LogLevel.Error,
            Message = "Number of hearings ({HearingCount}) does not match number of conferences ({ConferenceCount}) for user {Username}")]
        public static partial void LogHearingConferenceMismatch(this ILogger logger, int hearingCount, int conferenceCount, string username);

        [LoggerMessage(
            EventId = 1016,
            Level = LogLevel.Debug,
            Message = "GetConferencesForStaffMember")]
        public static partial void LogGetConferencesForStaffMember(this ILogger logger);

        [LoggerMessage(
            EventId = 1017,
            Level = LogLevel.Error,
            Message = "Number of hearings ({HearingCount}) does not match number of conferences ({ConferenceCount}) for venue(s) {Venues}")]
        public static partial void LogVenueHearingConferenceMismatch(this ILogger logger, int hearingCount, int conferenceCount, IEnumerable<string> venues);

        [LoggerMessage(
            EventId = 1018,
            Level = LogLevel.Debug,
            Message = "GetConferencesForIndividual")]
        public static partial void LogGetConferencesForIndividual(this ILogger logger);

        [LoggerMessage(
            EventId = 1019,
            Level = LogLevel.Debug,
            Message = "GetConferencesForVhOfficer")]
        public static partial void LogGetConferencesForVhOfficer(this ILogger logger);

        [LoggerMessage(
            EventId = 1020,
            Level = LogLevel.Warning,
            Message = "Unable to get conference when id is not provided")]
        public static partial void LogConferenceIdNotProvided(this ILogger logger);

        [LoggerMessage(
            EventId = 1021,
            Level = LogLevel.Information,
            Message = "Unauthorised to view conference details {ConferenceId} because user is not Officer " +
                      "nor a participant of the conference, or the conference has been closed for over 30 minutes")]
        public static partial void LogUnauthorizedConferenceAccess(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1022,
            Level = LogLevel.Debug,
            Message = "GetConferenceById")]
        public static partial void LogGetConferenceById(this ILogger logger);

        [LoggerMessage(
            EventId = 1023,
            Level = LogLevel.Warning,
            Message = "Conference details with id: {ConferenceId} not found")]
        public static partial void LogConferenceNotFound(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1024,
            Level = LogLevel.Error,
            Message = "Unable to retrieve conference: {ConferenceId}")]
        public static partial void LogUnableToRetrieveConference(this ILogger logger, Guid conferenceId, Exception exception);
    
        [LoggerMessage(
            EventId = 1025,
            Level = LogLevel.Debug,
            Message = "Setting the video control statuses for {ConferenceId}")]
        public static partial void LogSettingVideoControlStatuses(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1026,
            Level = LogLevel.Trace,
            Message = "Updating conference videoControlStatuses in cache: {SerializedStatuses}")]
        public static partial void LogUpdatingVideoControlStatusesInCache(this ILogger logger, string serializedStatuses);

        [LoggerMessage(
            EventId = 1027,
            Level = LogLevel.Trace,
            Message = "Set video control statuses ({@VideoControlStatuses}) for {ConferenceId}")]
        public static partial void LogSetVideoControlStatuses(this ILogger logger, object videoControlStatuses, Guid conferenceId);

        [LoggerMessage(
            EventId = 1028,
            Level = LogLevel.Debug,
            Message = "Getting the video control statuses for {ConferenceId}")]
        public static partial void LogGettingVideoControlStatuses(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1029,
            Level = LogLevel.Warning,
            Message = "Video control statuses with id: {ConferenceId} not found")]
        public static partial void LogVideoControlStatusesNotFound(this ILogger logger, Guid conferenceId);

        [LoggerMessage(
            EventId = 1030,
            Level = LogLevel.Trace,
            Message = "Got video control statuses ({@VideoControlStatuses}) for {ConferenceId}")]
        public static partial void LogGotVideoControlStatuses(this ILogger logger, object videoControlStatuses, Guid conferenceId);

        [LoggerMessage(
            EventId = 1031,
            Level = LogLevel.Error,
            Message = "ConferenceId: {ConferenceId}, ErrorCode: {StatusCode}")]
        public static partial void LogConferenceError(this ILogger logger, Exception exception, Guid conferenceId, int statusCode);
    
        [LoggerMessage(
            EventId = 1032,
            Level = LogLevel.Information,
            Message = "Populating Conference Cache")]
        public static partial void LogPopulatingConferenceCache(this ILogger logger);

        [LoggerMessage(
            EventId = 1033,
            Level = LogLevel.Information,
            Message = "Lock released")]
        public static partial void LogLockReleased(this ILogger logger);

        [LoggerMessage(
            EventId = 1034,
            Level = LogLevel.Information,
            Message = "Another VideoWeb instance is already processing the job")]
        public static partial void LogAnotherInstanceProcessing(this ILogger logger);

        [LoggerMessage(
            EventId = 1035,
            Level = LogLevel.Error,
            Message = "Error occurred while executing PopulateConferenceCacheForToday")]
        public static partial void LogErrorPopulatingConferenceCache(this ILogger logger, Exception exception);
        
        [LoggerMessage(
            EventId = 1036,
            Level = LogLevel.Trace,
            Message = "Conference Countdown finished: Conference Id: {SourceConferenceId}")]
        public static partial void LogConferenceCountdownFinished(this ILogger logger, Guid sourceConferenceId);
        
        [LoggerMessage(
            EventId = 1037,
            Level = LogLevel.Trace,
            Message = "Recording Connection Failed: Conference Id: {ConferenceId} - Participant id: {ParticipantId}")]
        public static partial void LogRecordingConnectionFailed(this ILogger logger, Guid conferenceId, Guid participantId);

    }
}