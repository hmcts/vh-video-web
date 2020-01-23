using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Api.Uris;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Services.Video;
using UpdateParticipantRequest = VideoWeb.Services.Bookings.UpdateParticipantRequest;

namespace VideoWeb.AcceptanceTests.Builders
{
    public class ConferenceDetailsResponseBuilder
    {
        private readonly TestContext _context;
        private string _username;
        private const int MaxRetries = 5;
        private readonly TimeSpan _delay = TimeSpan.FromSeconds(1);
        private bool _expectTheParticipantToExist;
        private UpdateParticipantRequest _updateRequest;

        public ConferenceDetailsResponseBuilder(TestContext context)
        {
            _context = context;
            _context.Request = _context.Get(new ConferenceEndpoints().GetConferenceDetailsById(_context.Test.NewConferenceId));
        }

        public ConferenceDetailsResponseBuilder WithUsername(string username)
        {
            _username = username;
            return this;
        }

        public ConferenceDetailsResponseBuilder IsAdded()
        {
            _expectTheParticipantToExist = true;
            return this;
        }

        public ConferenceDetailsResponseBuilder IsRemoved()
        {
            _expectTheParticipantToExist = false;
            return this;
        }

        public ConferenceDetailsResponseBuilder ExpectedUpdate(UpdateParticipantRequest updateRequest)
        {
            _updateRequest = updateRequest;
            return this;
        }

        public bool PollForUpdatedHearing(string updatedWord)
        {
            for (var i = 0; i < MaxRetries; i++)
            {
                var conference = GetConferenceDetails();

                if (conference.Case_name.Contains(updatedWord))
                {
                    return true;
                }
                Thread.Sleep(_delay);
            }

            return false;
        }

        public bool PollForParticipant()
        {
            for (var i = 0; i < MaxRetries; i++)
            {
                var conference = GetConferenceDetails();

                if (_expectTheParticipantToExist)
                {
                    if (ParticipantExists(conference.Participants))
                    {
                        return true;
                    }
                }
                else
                {
                    if (!ParticipantExists(conference.Participants))
                    {
                        return true;
                    }
                }
                
                Thread.Sleep(_delay);
            }

            return false;
        }

        public bool PollForParticipantUpdated()
        {
            for (var i = 0; i < MaxRetries; i++)
            {
                var conference = GetConferenceDetails();
                var updatedParticipant = conference.Participants.Find(x => x.Username.ToLower().Equals(_username.ToLower()));

                if (updatedParticipant.Display_name.Equals(_updateRequest.Display_name) &&
                    updatedParticipant.Name.Contains($"{_updateRequest.Title}"))
                {
                    return true;
                }
                Thread.Sleep(_delay);
            }

            return false;
        }

        public bool PollForExpectedStatus(HttpStatusCode status)
        {
            for (var i = 0; i < MaxRetries; i++)
            {
                GetConferenceDetails();

                if (_context.Response.StatusCode.Equals(status))
                {
                    return true;
                }
                Thread.Sleep(_delay);
            }

            return false;
        }

        private bool ParticipantExists(IEnumerable<ParticipantDetailsResponse> participants)
        {
            return participants.Any(x => x.Username.ToLower().Equals(_username.ToLower()));
        }

        public ConferenceDetailsResponse GetConferenceDetails()
        {
            new ExecuteRequestBuilder()
                .WithContext(_context)
                .SendToVideoApiWithoutVerification();

            return RequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(_context.Response.Content);            
        }
    }
}
