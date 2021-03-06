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
using UserRole = VideoWeb.Services.Video.UserRole;

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
                .AddTypedParameters<EndpointsResponseMapper>()
                .Build();
            _sut = _mocker.Create<ConferenceResponseMapper>(parameters);
        }

        [Test]
        public void Should_map_all_properties()
        {
            var participants = new List<ParticipantDetailsResponse>
            {
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Representative, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Judge, "None").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.CaseAdmin, "None").Build(),
            };

            var endpoints = new List<EndpointResponse>
            {
                new EndpointsResponseBuilder().Build(),
                new EndpointsResponseBuilder().Build(),
            };

            var expectedConferenceStatus = ConferenceStatus.Suspended;

            var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Current_status = ConferenceState.Suspended)
                .With(x => x.Participants = participants)
                .With(x => x.Meeting_room = meetingRoom)
                .With(x=> x.Endpoints = endpoints)
                .Build();

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.Case_name);
            response.CaseType.Should().Be(conference.Case_type);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time);
            response.ScheduledDuration.Should().Be(conference.Scheduled_duration);
            response.Status.Should().Be(expectedConferenceStatus);
            response.Endpoints.Should().NotBeNull();
            response.Endpoints.Count.Should().Be(2);

            var participantsResponse = response.Participants;
            participantsResponse.Should().NotBeNullOrEmpty();
            foreach (var participantResponse in participantsResponse)
            {
                if (participantResponse.Role == Role.Representative)
                {
                    participantResponse.TiledDisplayName.StartsWith("T4").Should().BeTrue();

                }
                if (participantResponse.Role == Role.Judge)
                {
                    var judge = participants.SingleOrDefault(p => p.User_role == UserRole.Judge);
                    participantResponse.TiledDisplayName.Should().Be($"T{0};{judge.Display_name};{judge.Id}");
                }
                if (participantResponse.Role == Role.Individual)
                {
                    (participantResponse.TiledDisplayName.StartsWith("T1") ||
                        participantResponse.TiledDisplayName.StartsWith("T2")).Should().BeTrue();
                }
                if (participantResponse.Role == Role.CaseAdmin)
                {
                    participantResponse.TiledDisplayName.Should().BeNull();
                }
            }

            var caseTypeGroups = participantsResponse.Select(p => p.CaseTypeGroup).Distinct().ToList();
            caseTypeGroups.Count.Should().BeGreaterThan(2);
            caseTypeGroups[0].Should().Be("Claimant");
            caseTypeGroups[1].Should().Be("Defendant");
            caseTypeGroups[2].Should().Be("None");

            response.ParticipantUri.Should().Be(meetingRoom.Participant_uri);
            response.PexipNodeUri.Should().Be(meetingRoom.Pexip_node);
            response.PexipSelfTestNodeUri.Should().NotBeNullOrWhiteSpace();
        }

        [Test]
        public void Should_map_all_properties_for_more_then_4_participants()
        {
            var participants = new List<ParticipantDetailsResponse>
            {
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").WithHearingRole("Litigant in person").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").WithHearingRole("Litigant in person").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Representative, "Defendant").WithHearingRole("Representative").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Judge, "None").WithHearingRole("Judge").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.CaseAdmin, "None").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Observer").WithHearingRole("Observer").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Panel Member").WithHearingRole("Panel Member").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Panel Member").WithHearingRole("Panel Member").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Witness").WithHearingRole("Witness").Build()
            };


            var expectedConferenceStatus = ConferenceStatus.Suspended;

            var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Current_status = ConferenceState.Suspended)
                .With(x => x.Participants = participants)
                .With(x => x.Meeting_room = meetingRoom)
                .Build();

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.Case_name);
            response.CaseType.Should().Be(conference.Case_type);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time);
            response.ScheduledDuration.Should().Be(conference.Scheduled_duration);
            response.Status.Should().Be(expectedConferenceStatus);

            var participantsResponse = response.Participants;
            participantsResponse.Should().NotBeNullOrEmpty();

            var tiledNames = participantsResponse.Select(x => x.TiledDisplayName).ToList();

            foreach (var participantResponse in participantsResponse)
            {
                var position = participantResponse.TiledDisplayName.Split(';');
                if (participantResponse.Role == Role.Judge)
                {
                    participantResponse.TiledDisplayName.StartsWith("T0").Should().BeTrue();
                }

                if (position[0].StartsWith("T"))
                {
                    tiledNames.Count(x => x.StartsWith(position[0])).Should().Be(1);
                }
                if (participantResponse.HearingRole == "Witness" && participantResponse.Role == Role.Individual)
                {
                    participantResponse.TiledDisplayName.StartsWith("W").Should().BeTrue();
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

            response.ParticipantUri.Should().Be(meetingRoom.Participant_uri);
            response.PexipNodeUri.Should().Be(meetingRoom.Pexip_node);
            response.PexipSelfTestNodeUri.Should().NotBeNullOrWhiteSpace();
        }
    }
}
