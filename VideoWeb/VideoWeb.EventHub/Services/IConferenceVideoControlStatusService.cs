﻿using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.EventHub.Services
{
    public interface IConferenceVideoControlStatusService
    {
        Task<ConferenceVideoControlStatuses?> GetVideoControlStateForConference(Guid conferenceId);
        Task SetVideoControlStateForConference(Guid conferenceId, ConferenceVideoControlStatuses? conferenceVideoControlStatuses);
    }
}
