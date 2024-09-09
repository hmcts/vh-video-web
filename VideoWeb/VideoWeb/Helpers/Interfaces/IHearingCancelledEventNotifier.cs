using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Helpers.Interfaces
{
    public interface IHearingCancelledEventNotifier
    {
        Task PushHearingCancelledEvent(Conference conference);
    }
}
