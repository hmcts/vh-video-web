using System;
using System.Threading.Tasks;

namespace VideoWeb.Helpers.Interfaces
{
    public interface IHearingCancelledEventNotifier
    {
        Task PushHearingCancelledEvent(Guid conferenceId);
    }
}
