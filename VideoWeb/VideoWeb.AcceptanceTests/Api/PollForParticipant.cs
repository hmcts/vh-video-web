using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Requests;
using FluentAssertions;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Api
{
    public class PollForParticipant
    {
        private readonly VideoApiManager _videoApi;
        private Guid _conferenceId;
        private string _username;
        private bool _expectTheParticipantToExist;
        private int _maxRetries = 5;

        public PollForParticipant(VideoApiManager videoApi)
        {
            _videoApi = videoApi;
        }

        public PollForParticipant WithConferenceId(Guid conferenceId)
        {
            _conferenceId = conferenceId;
            return this;
        }

        public PollForParticipant WithParticipant(string username)
        {
            _username = username;
            return this;
        }

        public PollForParticipant IsAdded()
        {
            _expectTheParticipantToExist = true;
            return this;
        }

        public PollForParticipant IsRemoved()
        {
            _expectTheParticipantToExist = false;
            return this;
        }

        public PollForParticipant Retries(int maxRetries)
        {
            _maxRetries = maxRetries;
            return this;
        }

        public bool Poll()
        {

            for (var i = 0; i < _maxRetries; i++)
            {
                var response = _videoApi.GetConferenceByConferenceId(_conferenceId);
                var conference = RequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(response.Content);
                conference.Should().NotBeNull();

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

                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            return false;
        }

        private bool ParticipantExists(IEnumerable<ParticipantDetailsResponse> participants)
        {
            return participants.Any(x => x.Username.ToLower().Equals(_username.ToLower()));
        }
    }
}
