using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Extensions;

namespace VideoWeb.UnitTests.Extensions;

public class ConferenceForVhOfficerResponseExtensionsTests
{
    private List<ConferenceForVhOfficerResponse> unallocatedConferences;
    
    [SetUp]
    public void Setup()
    {
        unallocatedConferences = new List<ConferenceForVhOfficerResponse>
        {
            new ConferenceForVhOfficerResponse()
            {
                AllocatedCsoId = null,
                HearingVenueName = "Teesside Combined Court Centre",
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
                HearingVenueName = "Ayr Social Security and Child Support Tribunal"
            },
            new ConferenceForVhOfficerResponse()
            {
                AllocatedCsoId = null,
                HearingVenueName = "Dundee Tribunal Hearing Centre - Endeavour House",
            },
            new ConferenceForVhOfficerResponse()
            {
                AllocatedCsoId = null,
                HearingVenueName = "Birmingham Civil Justice Centre",
                CaseType = "Generic"
            },
        };
    }
    
    [Test]
    public void should_filter_out_unallocated_conferences_when_no_allocated_csos()
    {
        var filteredConferences = unallocatedConferences.ApplyCsoFilter(new VhoConferenceFilterQuery{IncludeUnallocated = true});
        filteredConferences.Should().HaveCount(1);
    }
    
    [Test]
    public void should_filter_out_unallocated_conferences_and_allocated_cso_conference()
    {
        var allocatedCsoId = Guid.NewGuid();
        unallocatedConferences.Add(
            new ConferenceForVhOfficerResponse { AllocatedCsoId = allocatedCsoId,  HearingVenueName = "Birmingham Magistrates Court" });
        var filteredConferences = unallocatedConferences
            .ApplyCsoFilter(new VhoConferenceFilterQuery{IncludeUnallocated = true, AllocatedCsoIds = new[] {allocatedCsoId}})
            .ToList();
        filteredConferences.Should().HaveCount(2);
    }    
    
    [Test]
    public void should_filter_out_only_allocated_cso_conference()
    {
        var allocatedCsoId = Guid.NewGuid();
        unallocatedConferences.Add(
            new ConferenceForVhOfficerResponse { AllocatedCsoId = allocatedCsoId,  HearingVenueName = "Birmingham Magistrates Court" });
        var filteredConferences = unallocatedConferences.ApplyCsoFilter(new VhoConferenceFilterQuery{IncludeUnallocated = false, AllocatedCsoIds = new[] {allocatedCsoId}});
        filteredConferences.Should().HaveCount(1);
    }
    
    [TearDown]
    public void TearDown()
    {
        unallocatedConferences = null;
    }
}
