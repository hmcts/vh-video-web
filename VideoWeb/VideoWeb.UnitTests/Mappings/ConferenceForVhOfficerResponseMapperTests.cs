using System.Linq;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Responses;
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
            conference.UpdateAllocation(null, ConferenceForVhOfficerResponseMapper.NotAllocated, null);

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

        [Test]
        public void should_map_no_allocation_supported_to_not_required()
        {
            var conference = ConferenceDetailsResponseBuilder.BuildConferenceDetailsResponseList(1)[0];
            var hearing = BuildHearingDetailsResponse(conference);
            hearing.SupportsWorkAllocation = false;

            var result = ConferenceForVhOfficerResponseMapper.Map(conference, hearing);
            result.AllocatedCso.Should().Be(ConferenceForVhOfficerResponseMapper.NotRequired);
        }
        
        [Test]
        public void should_map_not_allocated_to_not_allocated()
        {
            var conference = ConferenceDetailsResponseBuilder.BuildConferenceDetailsResponseList(1)[0];
            var hearing = BuildHearingDetailsResponse(conference);
            hearing.SupportsWorkAllocation = true;
            hearing.AllocatedToName = null;

            var result = ConferenceForVhOfficerResponseMapper.Map(conference, hearing);
            result.AllocatedCso.Should().Be(ConferenceForVhOfficerResponseMapper.NotAllocated);
        }
        
        [Test]
        public void should_map_allocated_to_allocated()
        {
            var conference = ConferenceDetailsResponseBuilder.BuildConferenceDetailsResponseList(1)[0];
            var hearing = BuildHearingDetailsResponse(conference);
            hearing.SupportsWorkAllocation = true;
            hearing.AllocatedToName = "CSO John Doe";

            var result = ConferenceForVhOfficerResponseMapper.Map(conference, hearing);
            result.AllocatedCso.Should().Be("CSO John Doe");
        }

        private static HearingDetailsResponseV2 BuildHearingDetailsResponse(ConferenceDetailsResponse conference)
        {

            return Builder<HearingDetailsResponseV2>.CreateNew()
                .With(x => x.Id = conference.HearingId)
                .With(x => x.BookingSupplier = BookingSupplier.Vodafone)
                .With(x => x.HearingVenueName = "Venue")
                .With(x => x.Cases = Builder<CaseResponseV2>.CreateListOfSize(1).Build().ToList())
                .With(x => x.SupportsWorkAllocation = true)
                .Build();
        }
    }
}
