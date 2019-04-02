using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceResponseMapperTests
    {
        private readonly ConferenceResponseMapper _mapper = new ConferenceResponseMapper();

        [Test]
        public void should_map_all_properties()
        {
            var participant = Builder<ParticipantDetailsResponse>.CreateNew()
                .With(x => x.Current_status = new ParticipantStatusResponse
                {
                    Participant_state = ParticipantState.Available,
                    Time_stamp = DateTime.UtcNow
                })
                .Build();
            
            var expectedConferenceStatus = ConferenceStatus.Suspended;
            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Current_status = ConferenceState.Suspended)
                .With(x => x.Participants = new List<ParticipantDetailsResponse>{participant})
                .Build();
            
            var response = _mapper.MapConferenceDetailsToResponseModel(conference);

            response.Id.Should().Be(conference.Id.GetValueOrDefault());
            response.CaseName.Should().Be(conference.Case_name);
            response.CaseType.Should().Be(conference.Case_type);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time.GetValueOrDefault());
            response.ScheduledDuration.Should().Be(conference.Scheduled_duration.GetValueOrDefault());
            response.Status.Should().Be(expectedConferenceStatus);

            var participants = response.Participants;
            participants.Should().NotBeNullOrEmpty();
        }
    }
}