using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using ParticipantResponse = BookingsApi.Contract.V1.Responses.ParticipantResponse;

namespace VideoWeb.Services
{
    public class ConferenceService : IConferenceService
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IBookingsApiClient _bookingApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<ConferenceService> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly IParticipantsUpdatedEventNotifier _participantsUpdatedEventNotifier;
        private readonly int startingSoonMinutesThreshold = 30;
        private readonly int closedMinutesThreshold = 30;

        public ConferenceService(IVideoApiClient videoApiClient, IConferenceCache conferenceCache, ILogger<ConferenceService> logger,
            IMapperFactory mapperFactory, IParticipantsUpdatedEventNotifier participantsUpdatedEventNotifier, IBookingsApiClient bookingApiClient)
        {
            _videoApiClient = videoApiClient;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _participantsUpdatedEventNotifier = participantsUpdatedEventNotifier;
            _bookingApiClient = bookingApiClient;
        }

        public ConferenceService(IBookingsApiClient bookingApiClient)
        {
            _bookingApiClient = bookingApiClient;
        }
        
        
        public async Task<Conference> GetOrAddConferenceAsync(Guid conferenceId)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId,
                () => ComposeConference(conferenceId));
            
            if (conference == null)
            {
                throw new ConferenceNotFoundException(conferenceId);
            }
            
            return conference;
        }
        
        private async Task<ConferenceDetailsResponse> ComposeConference(Guid conferenceId)
        {
            var conference = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            var hearingId = conference.HearingId;
            
            var hearing = await _bookingApiClient.GetHearingDetailsByIdV2Async(hearingId);
            
            var participantsInHearing = hearing.Participants;
            var judiciaryParticipants = hearing.JudiciaryParticipants;
            
            
            var participantsInConference = await _videoApiClient.GetParticipantsByConferenceIdAsync(conferenceId);
            
            var mapper = new ParticipantDetailResponseMapper();
            
            conference.Participants = mapper.Map(participantsInHearing, judiciaryParticipants, participantsInConference);
            
            await _conferenceCache.AddConferenceAsync(conference);
            
            return conference;
        }
    }
}
