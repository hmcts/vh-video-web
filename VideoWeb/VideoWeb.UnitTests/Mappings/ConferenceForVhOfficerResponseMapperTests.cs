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

            var response = ConferenceForVhOfficerResponseMapper.Map(conference, null);

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
            response.Supplier.Should().Be(conference.Supplier);
        }

        [Test]
        public void should_map_unallocated_when_venue_supports_work_allocation_and_cso_is_not_set()
        {
            var conference = new ConferenceCacheModelBuilder().Build();

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
            var conference = new ConferenceCacheModelBuilder().Build();

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
            var conference = new ConferenceCacheModelBuilder().Build();

            var allocatedCsoResponse = new AllocatedCsoResponse
            {
                SupportsWorkAllocation = false
            };
            
            var response = ConferenceForVhOfficerResponseMapper.Map(conference, allocatedCsoResponse);
            
            response.AllocatedCso.Should().Be(ConferenceForVhOfficerResponseMapper.NotRequired);
        }
    }
}
