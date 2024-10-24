using System.Linq;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Common.Models;

public class GetNonScreenedParticipantsAndEndpointsTests
{
    private Conference _conference;
        
    [SetUp]
    public void SetUp()
    {
        _conference = new ConferenceCacheModelBuilder().Build();
        _conference.Participants.ForEach(p => p.ProtectFrom.Clear());
        _conference.Endpoints.ForEach(e => e.ProtectFrom.Clear());
    }

    [Test]
    public void should_return_hosts_only_if_no_participants_have_screening()
    {
        _conference.Participants.ForEach(p => p.ProtectFrom.Clear());
        _conference.Endpoints.ForEach(e => e.ProtectFrom.Clear());
            
        var nonScreenedParticipantsAndEndpoints = _conference.GetNonScreenedParticipantsAndEndpoints();
            
        nonScreenedParticipantsAndEndpoints.Should().BeEquivalentTo([_conference.GetJudge().Id]);
    }

    [Test]
    public void should_return_all_non_protected_participants_when_there_is_screening()
    {
        var participant1 = _conference.Participants[0];
        var endpoint1 = _conference.Endpoints[0];
            
        participant1.ProtectFrom.Add(endpoint1.ExternalReferenceId);
            
        var nonScreenedParticipantsAndEndpoints = _conference.GetNonScreenedParticipantsAndEndpoints();
        var expectedParticipants = _conference.Participants.Where(p => p.Id != participant1.Id).Select(p => p.Id);
        var expectedEndpoints = _conference.Endpoints.Where(e => e.Id != endpoint1.Id).Select(e => e.Id);
            
        nonScreenedParticipantsAndEndpoints.Should().BeEquivalentTo(expectedParticipants.Union(expectedEndpoints));
    }
}
