using System.Collections.Generic;
using System.Linq;
using VideoWeb.EventHub.Models;

namespace VideoWeb.Extensions
{
    public static class CallbackEventExtensions
    {
        public static void RemoveRepeatedVhoCallConferenceEvents(this List<CallbackEvent> events)
        {
            events.RemoveAll(x => 
                x.EventType == EventHub.Enums.EventType.VhoCall && 
                x.ParticipantId != events.First(y => y.EventType == EventHub.Enums.EventType.VhoCall).ParticipantId);
        }
    }
}
