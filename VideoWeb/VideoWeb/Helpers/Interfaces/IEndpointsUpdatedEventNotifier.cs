using VideoApi.Contract.Responses;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;

namespace VideoWeb.Helpers.Interfaces
{
    public interface IEndpointsUpdatedEventNotifier
    {
        public Task PushEndpointsUpdatedEvent(Conference conference, UpdateConferenceEndpointsRequest endpointsToNotify);
    }
}
