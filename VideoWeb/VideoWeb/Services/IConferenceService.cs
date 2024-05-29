using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Services
{
    public interface IConferenceService
    {
        Task <Conference>GetOrAddConferenceAsync(Guid conferenceId);
    }
}
