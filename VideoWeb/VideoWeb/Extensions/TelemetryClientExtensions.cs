using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.ApplicationInsights;
using Newtonsoft.Json;
using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Models;

namespace VideoWeb.Extensions
{
    public static class TelemetryClientExtensions
    {
        public static void TrackCustomEvent(this TelemetryClient telemetryClient, string eventName, ConferenceEventRequest conferenceEventRequest)
        {
            try
            {
                if (conferenceEventRequest == null)
                    return;

                var eventProperties = new Dictionary<string, string>();
                eventProperties.Add("sourceEventId", ReplaceWhitespaceOrNull(conferenceEventRequest.EventId));
                eventProperties.Add("participantId", ReplaceWhitespaceOrNull(conferenceEventRequest.ParticipantId));
                eventProperties.Add("participantRoomId", ReplaceWhitespaceOrNull(conferenceEventRequest.ParticipantRoomId));
                eventProperties.Add("eventType", conferenceEventRequest.EventType.ToString());
                eventProperties.Add("eventTimeStampUtc", conferenceEventRequest.TimeStampUtc.ToString("u"));
                eventProperties.Add("timestamp", DateTime.Now.ToString("u"));
                eventProperties.Add("conferenceId", ReplaceWhitespaceOrNull(conferenceEventRequest.ConferenceId));
                eventProperties.Add("phone", ReplaceWhitespaceOrNull(conferenceEventRequest.Phone));
                eventProperties.Add("reason", ReplaceWhitespaceOrNull(conferenceEventRequest.Reason));
                eventProperties.Add("transferFrom", ReplaceWhitespaceOrNull(conferenceEventRequest.TransferFrom));
                eventProperties.Add("transferTo", ReplaceWhitespaceOrNull(conferenceEventRequest.TransferTo));

                telemetryClient.TrackEvent(eventName, eventProperties);
            }
            catch (Exception e)
            {
                var eventProperties = new Dictionary<string, string>();
                eventProperties.Add("exceptionMessage", e.Message);
                telemetryClient.TrackEvent($"COULD_NOT_TRACK_CUSTOM_EVENT_{eventName}", eventProperties);
            }
        }

        public static void TrackCustomEvent(this TelemetryClient telemetryClient, string eventName, CallbackEvent callbackEvent)
        {
            if (callbackEvent == null)
                return;

            try
            {
                var eventProperties = new Dictionary<string, string>();
                eventProperties.Add("sourceEventId", ReplaceWhitespaceOrNull(callbackEvent.EventId));
                eventProperties.Add("reason", ReplaceWhitespaceOrNull(callbackEvent.Reason));
                eventProperties.Add("transferFrom", ReplaceWhitespaceOrNull(callbackEvent.TransferFrom));
                eventProperties.Add("transferTo", ReplaceWhitespaceOrNull(callbackEvent.TransferTo));
                eventProperties.Add("conferenceId", callbackEvent.ConferenceId.ToString());
                eventProperties.Add("conferenceStatus", callbackEvent.ConferenceStatus.ToString());
                eventProperties.Add("eventType", callbackEvent.EventType.ToString());
                eventProperties.Add("participantId", callbackEvent.ParticipantId.ToString());
                eventProperties.Add("eventTimeStampUtc", callbackEvent.TimeStampUtc.ToString("u"));
                eventProperties.Add("isParticipantInVmr", callbackEvent.IsParticipantInVmr.ToString());
                eventProperties.Add("timestamp", DateTime.Now.ToString("u"));
                eventProperties.Add("isOtherParticipantsInConsultationRoom", callbackEvent.IsOtherParticipantsInConsultationRoom.ToString());
                telemetryClient.TrackEvent(eventName, eventProperties);
            }
            catch (Exception e)
            {
                var eventProperties = new Dictionary<string, string>();
                eventProperties.Add("exceptionMessage", e.Message);
                telemetryClient.TrackEvent($"COULD_NOT_TRACK_CUSTOM_EVENT_{eventName}", eventProperties);
            }
        }

        private static string ReplaceWhitespaceOrNull(string input, string replaceWith = "NOT PROVIDED")
        {
            return string.IsNullOrWhiteSpace(input) ? replaceWith : input;
        }
        
    }
}
