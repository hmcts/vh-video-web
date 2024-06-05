using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using VideoApi.Contract.Enums;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceResponseMapperTests
    {
        private ConferenceResponseMapper _sut;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantResponseMapper>()
                .AddTypedParameters<VideoEndpointsResponseMapper>()
                .Build();
            _sut = _mocker.Create<ConferenceResponseMapper>(parameters);
        }

        [Test]
        public void Should_map_all_properties()
        {
            var participants = new List<ParticipantDto>
            {
                new ParticipantBuilder(Role.Individual, "Claimant").WithHearingRole("Litigant in person").Build(),
                new ParticipantBuilder(Role.Individual, "Defendant").WithHearingRole("Litigant in person").Build(),
                new ParticipantBuilder(Role.Representative, "Defendant").WithHearingRole("Representative").Build(),
                new ParticipantBuilder(Role.Judge, "None").WithHearingRole("Judge").Build(),
                new ParticipantBuilder(Role.CaseAdmin, "None").Build(),
                new ParticipantBuilder(Role.Individual, "Observer").WithHearingRole("Observer").Build(),
                new ParticipantBuilder(Role.Individual, "Panel Member").WithHearingRole("Panel Member").Build(),
                new ParticipantBuilder(Role.Individual, "Panel Member").WithHearingRole("Panel Member").Build(),
                new ParticipantBuilder(Role.Individual, "Witness").WithHearingRole("Witness").Build()
            };


            var expectedConferenceStatus = ConferenceStatus.Suspended;

            var meetingRoomResponse = Builder<MeetingRoomResponse>.CreateNew().Build();
            var meetingRoom = new ConferenceMeetingRoom()
            {
                ParticipantUri = meetingRoomResponse.ParticipantUri,
                PexipNode = meetingRoomResponse.PexipNode,
                PexipSelfTest = meetingRoomResponse.PexipSelfTestNode
            };
            
            
            var conference = Builder<ConferenceDto>.CreateNew()
                .With(x => x.CurrentStatus = ConferenceState.Suspended)
                .With(x => x.Participants = participants)
                .With(x => x.MeetingRoom = meetingRoom)
                .With(x => x.IsScottish = true)
                .Build();

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.CaseName);
            response.CaseType.Should().Be(conference.CaseType);
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
            response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
            response.Status.Should().Be(expectedConferenceStatus);
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
            }

            var caseTypeGroups = participantsResponse.Select(p => p.CaseTypeGroup).Distinct().ToList();
            caseTypeGroups.Count.Should().BeGreaterThan(2);
            caseTypeGroups[0].Should().Be("Claimant");
            caseTypeGroups[1].Should().Be("Defendant");
            caseTypeGroups[2].Should().Be("None");
            caseTypeGroups[3].Should().Be("Observer");
            caseTypeGroups[4].Should().Be("Panel Member");

            response.ParticipantUri.Should().Be(meetingRoom.ParticipantUri);
            response.PexipNodeUri.Should().Be(meetingRoom.PexipNode);
            response.PexipSelfTestNodeUri.Should().NotBeNullOrWhiteSpace();
        }
    }
}
