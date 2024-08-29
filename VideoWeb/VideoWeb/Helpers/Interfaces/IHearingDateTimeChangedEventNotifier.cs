using System;
using System.Threading.Tasks;

namespace VideoWeb.Helpers.Interfaces
{
    public interface IHearingDateTimeChangedEventNotifier
    {
        Task PushHearingDateTimeChangedEvent(Guid conferenceId);
    }
}
