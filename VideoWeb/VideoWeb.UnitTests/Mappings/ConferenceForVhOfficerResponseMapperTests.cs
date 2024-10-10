using System;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceForVhOfficerResponseMapperTests
    {
        [Test]
        public void Should_map_all_properties()
        {
            var conference = new ConferenceCacheModelBuilder().Build();
            conference.AllocatedCso = ConferenceForVhOfficerResponseMapper.NotAllocated;

            var response = ConferenceForVhOfficerResponseMapper.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.CaseName);
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.CaseType.Should().Be(conference.CaseType);
            response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
            response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
            response.Status.ToString().Should().Be(conference.CurrentStatus.ToString());
            response.HearingVenueName.Should().Be(conference.HearingVenueName);
            response.Participants.Count.Should().Be(conference.Participants.Count);
            response.StartedDateTime.Should().Be(conference.ScheduledDateTime);
            response.ClosedDateTime.Should().Be(conference.ClosedDateTime);
            response.TelephoneConferenceId.Should().Be(conference.TelephoneConferenceId);
            response.TelephoneConferenceNumbers.Should().Be(conference.TelephoneConferenceNumbers);
            response.CreatedDateTime.Should().Be(conference.CreatedDateTime);
            response.AllocatedCso.Should().Be(ConferenceForVhOfficerResponseMapper.NotAllocated);
            response.AllocatedCsoId.Should().Be(conference.AllocatedCsoId);
            response.Supplier.Should().Be(conference.Supplier);
        }
    }
}
