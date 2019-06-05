using System.Collections.Generic;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using Testing.Common.Builders;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceResponseMapperTests
    {
        private readonly ConferenceResponseMapper _mapper = new ConferenceResponseMapper();

        [Test]
        public void should_map_all_properties()
        {
            var participants = new List<ParticipantDetailsResponse>
            {
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Representative, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Judge, "None").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.VideoHearingsOfficer, "None").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.CaseAdmin, "None").Build()
            };

            var expectedConferenceStatus = ConferenceStatus.Suspended;

            var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Current_status = ConferenceState.Suspended)
                .With(x => x.Participants = participants)
                .With(x => x.Meeting_room = meetingRoom)
                .Build();

            var response = _mapper.MapConferenceDetailsToResponseModel(conference);

            response.Id.Should().Be(conference.Id.GetValueOrDefault());
            response.CaseName.Should().Be(conference.Case_name);
            response.CaseType.Should().Be(conference.Case_type);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time.GetValueOrDefault());
            response.ScheduledDuration.Should().Be(conference.Scheduled_duration.GetValueOrDefault());
            response.Status.Should().Be(expectedConferenceStatus);

            var participantsResponse = response.Participants;
            participants.Should().NotBeNullOrEmpty();
            foreach (var participantResponse in participantsResponse)
            {
                if (participantResponse.Role == Contract.Responses.UserRole.Judge ||
                    participantResponse.Role == Contract.Responses.UserRole.Individual ||
                    participantResponse.Role == Contract.Responses.UserRole.Representative)
                {
                    participantResponse.TiledDisplayName.Should().NotBeNullOrEmpty();
                }
            }

            response.AdminIFrameUri.Should().Be(meetingRoom.Admin_uri);
            response.JudgeIFrameUri.Should().Be(meetingRoom.Judge_uri);
            response.ParticipantUri.Should().Be(meetingRoom.Participant_uri);
            response.PexipNodeUri.Should().Be(meetingRoom.Pexip_node);
            response.PexipSelfTestNodeUri.Should().NotBeNullOrWhiteSpace();
        }
    }
}