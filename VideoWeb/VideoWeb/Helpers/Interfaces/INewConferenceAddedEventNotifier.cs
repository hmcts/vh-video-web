using System;
using System.Threading.Tasks;

namespace VideoWeb.Helpers.Interfaces
{
    public interface INewConferenceAddedEventNotifier
    {
        Task PushNewConferenceAddedEvent(Guid conferenceId);
    }
}
