using System;
using System.Threading.Tasks;

namespace VideoWeb.Helpers.Interfaces
{
    public interface IHearingDetailsUpdatedEventNotifier
    {
        public Task PushHearingDetailsUpdatedEvent(Guid conferenceId);
    }
}
