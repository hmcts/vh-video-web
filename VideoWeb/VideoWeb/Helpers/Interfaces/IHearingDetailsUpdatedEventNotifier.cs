using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Helpers.Interfaces
{
    public interface IHearingDetailsUpdatedEventNotifier
    {
        public Task PushHearingDetailsUpdatedEvent(Conference conference);
    }
}
