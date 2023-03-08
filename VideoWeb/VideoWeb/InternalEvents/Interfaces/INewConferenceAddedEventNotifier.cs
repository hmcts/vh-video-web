using System;
using System.Threading.Tasks;

namespace VideoWeb.InternalEvents.Interfaces
{
    public interface INewConferenceAddedEventNotifier
    {
        Task PushNewConferenceAddedEvent(Guid conferenceId);
    }
}
