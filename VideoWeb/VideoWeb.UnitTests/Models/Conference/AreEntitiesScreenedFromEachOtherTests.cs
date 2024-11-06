using System;
using System.Linq;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Models.Conference;

public class AreEntitiesScreenedFromEachOtherTests
{
    [Test]
    public void should_return_false_if_no_participants_or_endpoints_have_screening_requirements()
    {
        var conference = new ConferenceCacheModelBuilder()
            .Build();

        var quickLinkParticipant = new Participant()
        {
            Id = Guid.NewGuid(),
            ExternalReferenceId = null,
            Role = Role.QuickLinkParticipant,
            HearingRole = "Quick Link Participant",
            DisplayName = "QL 1"
        };
        conference.AddParticipant(quickLinkParticipant);
        
        var participantIds = conference.Participants.Select(x => x.Id).ToList();
        var endpointIds = conference.Endpoints.Select(x => x.Id).ToList();
        
        conference.AreEntitiesScreenedFromEachOther(participantIds, endpointIds).Should().BeFalse();
    }
    
    [Test]
    public void should_return_true_if_any_participant_is_to_be_screened_from_another_entity_in_the_consultation_invite_list()
    {
        var conference = new ConferenceCacheModelBuilder()
            .Build();

        var participant = conference.Participants.Find(x => x.Role == Role.Individual);
        var endpoint = conference.Endpoints[0];
        participant.ProtectFrom.Add(endpoint.ExternalReferenceId);
        
        var participantIds = conference.Participants.Select(x => x.Id).ToList();
        var endpointIds = conference.Endpoints.Select(x => x.Id).ToList();
        
        conference.AreEntitiesScreenedFromEachOther(participantIds, endpointIds).Should().BeTrue();
    }

    [Test]
    public void
        should_return_true_if_any_endpoint_is_to_be_screened_from_another_entity_in_the_consultation_invite_list()
    {
        var conference = new ConferenceCacheModelBuilder()
            .Build();

        var participant = conference.Participants.Find(x => x.Role == Role.Individual);
        var endpoint = conference.Endpoints[0];
        participant.ProtectFrom.Add(endpoint.ExternalReferenceId);
        
        var participantIds = conference.Participants.Select(x => x.Id).ToList();
        var endpointIds = conference.Endpoints.Select(x => x.Id).ToList();
        
        conference.AreEntitiesScreenedFromEachOther(participantIds, endpointIds).Should().BeTrue();
    }
}
