using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings;

public class ConferenceResponseMapperTests
{
    [Test]
    public void Should_map_all_properties()
    {
        var interpreterLanguage = new InterpreterLanguage
        {
            Code = "spa",
            Description = "Spanish",
            Type = InterpreterType.Verbal
        };
        
        var participants = new List<Participant>
        {
            new ParticipantBuilder(Role.Individual).WithHearingRole("Litigant in person").WithInterpreterLanguage(interpreterLanguage).Build(),
            new ParticipantBuilder(Role.Individual).WithHearingRole("Litigant in person").WithInterpreterLanguage(interpreterLanguage).Build(),
            new ParticipantBuilder(Role.Representative).WithHearingRole("Representative").WithInterpreterLanguage(interpreterLanguage).Build(),
            new ParticipantBuilder(Role.Judge).WithHearingRole("Judge").WithInterpreterLanguage(interpreterLanguage).Build(),
            new ParticipantBuilder(Role.CaseAdmin).WithInterpreterLanguage(interpreterLanguage).Build(),
            new ParticipantBuilder(Role.Individual).WithHearingRole("Observer").WithInterpreterLanguage(interpreterLanguage).Build(),
            new ParticipantBuilder(Role.Individual).WithHearingRole("Panel Member").WithInterpreterLanguage(interpreterLanguage).Build(),
            new ParticipantBuilder(Role.Individual).WithHearingRole("Panel Member").WithInterpreterLanguage(interpreterLanguage).Build(),
            new ParticipantBuilder(Role.Individual).WithHearingRole("Witness").WithInterpreterLanguage(interpreterLanguage).Build()
        };
        
        
        var expectedConferenceStatus = ConferenceStatus.InSession;
        
        var meetingRoomResponse = Builder<MeetingRoomResponse>.CreateNew().Build();
        var meetingRoom = new ConferenceMeetingRoom()
        {
            ParticipantUri = meetingRoomResponse.ParticipantUri,
            PexipNode = meetingRoomResponse.PexipNode,
            PexipSelfTest = meetingRoomResponse.PexipSelfTestNode
        };
        
        
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.CurrentStatus = ConferenceStatus.InSession)
            .With(x => x.Participants = participants)
            .With(x => x.MeetingRoom = meetingRoom)
            .With(x => x.IsScottish = true)
            .With(x=> x.CountdownComplete = true)
            .Build();
        
        var response = ConferenceResponseMapper.Map(conference);
        
        response.Id.Should().Be(conference.Id);
        response.CaseName.Should().Be(conference.CaseName);
        response.CaseType.Should().Be(conference.CaseType);
        response.CaseNumber.Should().Be(conference.CaseNumber);
        response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
        response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
        response.Status.Should().Be(expectedConferenceStatus);
        response.CountdownCompleted.Should().BeTrue();
        response.HearingVenueIsScottish.Should().Be(conference.IsScottish);
        
        var participantsResponse = response.Participants;
        participantsResponse.Should().NotBeNullOrEmpty();
        
        var tiledNames = participantsResponse.Select(x => x.TiledDisplayName).ToList();
        
        foreach (var participantResponse in participantsResponse)
        {
            var position = participantResponse.TiledDisplayName.Split(';');
            if (participantResponse.Role == Role.Judge)
            {
                participantResponse.TiledDisplayName.StartsWith("JUDGE").Should().BeTrue();
            }
            
            if (position[0].StartsWith("JUDGE"))
            {
                tiledNames.Count(x => x.StartsWith(position[0])).Should().Be(1);
            }
            if (participantResponse.HearingRole == "WITNESS" && participantResponse.Role == Role.Individual)
            {
                participantResponse.TiledDisplayName.StartsWith("WITNESS").Should().BeTrue();
                tiledNames.Count(x => x.StartsWith(position[0])).Should().Be(1);
            }
            var participant = participants.Find(p => p.Id == participantResponse.Id);
            participantResponse.InterpreterLanguage.Should().BeEquivalentTo(participant.InterpreterLanguage.Map());
        }
        response.ParticipantUri.Should().Be(meetingRoom.ParticipantUri);
        response.PexipNodeUri.Should().Be(meetingRoom.PexipNode);
        response.PexipSelfTestNodeUri.Should().NotBeNullOrWhiteSpace();
        response.Supplier.Should().Be(conference.Supplier);
    }
}
