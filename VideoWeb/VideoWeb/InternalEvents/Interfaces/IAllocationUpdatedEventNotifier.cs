using System.Collections.Generic;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.InternalEvents.Interfaces
{
    public interface IAllocationUpdatedEventNotifier
    {
        Task PushAllocationUpdatedEvent(string csoUsername, List<Conference> conferences);
    }
}
