using System;
using System.Collections.Generic;
using BookingsApi.Contract.V1.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using VideoApi.Contract.Enums;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceForVhOfficerResponseMapperTests
    {
        [Test]
        public void Should_map_all_properties()
        {
            var conference = BuildConferenceForTest();

            var response = ConferenceForVhOfficerResponseMapper.Map(conference, null);

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.CaseName);
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.CaseType.Should().Be(conference.CaseType);
            response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
            response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
            response.Status.ToString().Should().Be(conference.Status.ToString());
            response.HearingVenueName.Should().Be(conference.HearingVenueName);
            response.Participants.Count.Should().Be(conference.Participants.Count);
            response.StartedDateTime.Should().Be(conference.StartedDateTime);
            response.ClosedDateTime.Should().Be(conference.ClosedDateTime);
            response.TelephoneConferenceId.Should().Be(conference.TelephoneConferenceId);
            response.TelephoneConferenceNumbers.Should().Be(conference.TelephoneConferenceNumbers);
            response.CreatedDateTime.Should().Be(conference.CreatedDateTime);
            response.AllocatedCso.Should().Be(ConferenceForVhOfficerResponseMapper.NotAllocated);
        }

        [Test]
        public void should_map_unallocated_when_venue_supports_work_allocation_and_cso_is_not_set()
        {
            var conference = BuildConferenceForTest();
            var allocatedCsoResponse = new AllocatedCsoResponse
            {
                SupportsWorkAllocation = true
            };
            
            var response = ConferenceForVhOfficerResponseMapper.Map(conference, allocatedCsoResponse);
            
            response.AllocatedCso.Should().Be(ConferenceForVhOfficerResponseMapper.NotAllocated);
        }
        
        [Test]
        public void should_map_cso_fullname_when_venue_supports_work_allocation_and_cso_is_set()
        {
            var fullName = "Foo Bar";
            var conference = BuildConferenceForTest();
            var allocatedCsoResponse = new AllocatedCsoResponse
            {
                SupportsWorkAllocation = true,
                Cso = new JusticeUserResponse()
                {
                    FullName = fullName,
                }
            };
            
            var response = ConferenceForVhOfficerResponseMapper.Map(conference, allocatedCsoResponse);
            
            response.AllocatedCso.Should().Be(fullName);
        }
        
        [Test]
        public void should_map_required_when_venue_does_not_support_work_allocation()
        {
            var conference = BuildConferenceForTest();
            var allocatedCsoResponse = new AllocatedCsoResponse
            {
                SupportsWorkAllocation = false
            };
            
            var response = ConferenceForVhOfficerResponseMapper.Map(conference, allocatedCsoResponse);
            
            response.AllocatedCso.Should().Be(ConferenceForVhOfficerResponseMapper.NotRequired);
        }

        private ConferenceForAdminResponse BuildConferenceForTest()
        {
            var conference = Builder<ConferenceForAdminResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.HearingRefId = Guid.NewGuid())
                .Build();

            var participants = new List<ParticipantResponse>
            {
                new ParticipantResponseBuilder(UserRole.Individual)
                    .WithStatus(ParticipantState.Available).Build(),
                new ParticipantResponseBuilder(UserRole.Representative)
                    .WithStatus(ParticipantState.Disconnected).Build(),
                new ParticipantResponseBuilder(UserRole.Judge)
                    .WithStatus(ParticipantState.NotSignedIn).Build()
            };

            conference.Participants = participants;
            return conference;
        }
    }
}
