using System.Collections.Generic;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.InternalEvents.Interfaces
{
    public interface IParticipantsUpdatedEventNotifier
    {
        public Task PushParticipantsUpdatedEvent(Conference conference, IList<Participant> participantsToNotify);
    }
}
