using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using UserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceResponseMapperTests
    {
        [Test]
        public void Should_map_all_properties()
        {
            var participants = new List<ParticipantDetailsResponse>
            {
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Representative, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Judge, "None").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.CaseAdmin, "None").Build()
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

            var response = ConferenceResponseMapper.MapConferenceDetailsToResponseModel(conference);

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
                    participantResponse.TiledDisplayName.StartsWith("T0").Should().BeTrue();
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
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Representative, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Judge, "None").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.CaseAdmin, "None").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Observer").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Panel Member").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Panel Member").Build()
            };


            var expectedConferenceStatus = ConferenceStatus.Suspended;

            var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Current_status = ConferenceState.Suspended)
                .With(x => x.Participants = participants)
                .With(x => x.Meeting_room = meetingRoom)
                .Build();

            var response = ConferenceResponseMapper.MapConferenceDetailsToResponseModel(conference);

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
