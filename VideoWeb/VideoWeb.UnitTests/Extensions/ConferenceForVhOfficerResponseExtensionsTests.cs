using System.Collections.Generic;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Extensions;

namespace VideoWeb.UnitTests.Extensions;

public class ConferenceForVhOfficerResponseExtensionsTests
{
    private IEnumerable<ConferenceForVhOfficerResponse> unallocatedConferences;
    
    [SetUp]
    public void Setup()
    {
        unallocatedConferences = new List<ConferenceForVhOfficerResponse>
        {
            new ConferenceForVhOfficerResponse()
            {
                AllocatedCsoId = null,
                HearingVenueName = "Teesside Combined Court Centre"
            },
            new ConferenceForVhOfficerResponse()
            {
                AllocatedCsoId = null,
                HearingVenueName = "Teesside Magistrates Court"
            },
            new ConferenceForVhOfficerResponse()
            {
                AllocatedCsoId = null,
                HearingVenueName = "Middlesbrough County Court"
            },
            new ConferenceForVhOfficerResponse()
            {
                AllocatedCsoId = null,
                HearingVenueName = "Birmingham Magistrates Court" //Only Valid venue
            },
            new ConferenceForVhOfficerResponse()
            {
                AllocatedCsoId = null,
                HearingVenueName = "Ayr"
            },
            new ConferenceForVhOfficerResponse()
            {
                AllocatedCsoId = null,
                HearingVenueName = "Dundee Tribunal Hearing Centre"
            }
        };
    }
    
    [Test]
    public void should_filter_out_unallocated_conferences_with_excluded_venue_names()
    {
        var filteredConferences = unallocatedConferences.ApplyCsoFilter(new VhoConferenceFilterQuery{IncludeUnallocated = true});
        filteredConferences.Should().HaveCount(1);
    }
}
