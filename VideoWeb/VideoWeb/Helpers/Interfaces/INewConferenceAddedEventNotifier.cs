using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Helpers.Interfaces
{
    public interface INewConferenceAddedEventNotifier
    {
        Task PushNewConferenceAddedEvent(Conference conference);
    }
}
