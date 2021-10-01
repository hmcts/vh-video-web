using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Helpers.Interfaces
{
    public interface IParticipantsUpdatedEventNotifier
    {
        public Task PushParticipantsUpdatedEvent(Conference conference);
    }
}
