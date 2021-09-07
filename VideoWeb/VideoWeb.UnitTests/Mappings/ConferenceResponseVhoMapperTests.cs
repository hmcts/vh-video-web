using System;
using System.Collections.Generic;
using System.Linq;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using BookingParticipant = BookingsApi.Contract.Responses.ParticipantResponse;
using VideoApi.Contract.Enums;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceResponseVhoMapperTests
    {
        private ConferenceResponseVhoMapper _sut;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .Build();
            _sut = _mocker.Create<ConferenceResponseVhoMapper>(parameters);
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
                new ParticipantDetailsResponseBuilder(UserRole.CaseAdmin, "None").Build()
            };

            var bookingParticipants = Builder<BookingParticipant>.CreateListOfSize(participants.Count)
                .Build().ToList();
            participants[0].RefId = bookingParticipants[0].Id;
            participants[1].RefId = bookingParticipants[1].Id;
            participants[2].RefId = bookingParticipants[2].Id;
            participants[3].RefId = bookingParticipants[3].Id;
            participants[4].RefId = bookingParticipants[4].Id;

            var expectedConferenceStatus = ConferenceStatus.Suspended;

            var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.CurrentStatus = ConferenceState.Suspended)
                .With(x => x.Participants = participants)
                .With(x => x.MeetingRoom = meetingRoom)
                .Build();

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.CaseName);
            response.CaseType.Should().Be(conference.CaseType);
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
            response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
            response.Status.Should().Be(expectedConferenceStatus);

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

            response.AdminIFrameUri.Should().Be(meetingRoom.AdminUri);
            response.ParticipantUri.Should().Be(meetingRoom.ParticipantUri);
            response.PexipNodeUri.Should().Be(meetingRoom.PexipNode);
        }

        [Test]
        public void Should_map_all_properties_with_empty_participants_list()
        {
            var participants = new List<ParticipantDetailsResponse>();

            var expectedConferenceStatus = ConferenceStatus.Suspended;

            var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.CurrentStatus = ConferenceState.Suspended)
                .With(x => x.Participants = participants)
                .With(x => x.MeetingRoom = meetingRoom)
                .Build();

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.CaseName);
            response.CaseType.Should().Be(conference.CaseType);
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
            response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
            response.Status.Should().Be(expectedConferenceStatus);

            response.AdminIFrameUri.Should().Be(meetingRoom.AdminUri);
            response.ParticipantUri.Should().Be(meetingRoom.ParticipantUri);
            response.PexipNodeUri.Should().Be(meetingRoom.PexipNode);
        }

        [Test]
        public void Maps_Hearing_Id_From_Conference()
        {
            var conference = Builder<ConferenceDetailsResponse>.CreateNew().Build();

            var response = _sut.Map(conference);

            response.HearingId.Should().Be(conference.HearingId);
        }

        [Test]
        public void Should_map_all_properties_with_participants_list_null()
        {
            var expectedConferenceStatus = ConferenceStatus.Suspended;

            var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.CurrentStatus = ConferenceState.Suspended)
                .With(x => x.Participants = null)
                .With(x => x.MeetingRoom = meetingRoom)
                .Build();

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.CaseName);
            response.CaseType.Should().Be(conference.CaseType);
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
            response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
            response.Status.Should().Be(expectedConferenceStatus);

            response.AdminIFrameUri.Should().Be(meetingRoom.AdminUri);
            response.ParticipantUri.Should().Be(meetingRoom.ParticipantUri);
            response.PexipNodeUri.Should().Be(meetingRoom.PexipNode);
        }

        [Test]
        public void Should_map_if_have_not_booking_participants_with_the_same_id()
        {
            var participants = new List<ParticipantDetailsResponse>
            {
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Representative, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Judge, "None").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.CaseAdmin, "None").Build()
            };

            participants[0].RefId = Guid.NewGuid();
            participants[1].RefId = Guid.NewGuid();
            participants[2].RefId = Guid.NewGuid();
            participants[3].RefId = Guid.NewGuid();
            participants[4].RefId = Guid.NewGuid();


            var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.CurrentStatus = ConferenceState.Suspended)
                .With(x => x.Participants = participants)
                .With(x => x.MeetingRoom = meetingRoom)
                .Build();

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.CaseName);
            response.CaseType.Should().Be(conference.CaseType);
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
            response.ScheduledDuration.Should().Be(conference.ScheduledDuration);

            response.AdminIFrameUri.Should().Be(meetingRoom.AdminUri);
            response.ParticipantUri.Should().Be(meetingRoom.ParticipantUri);
            response.PexipNodeUri.Should().Be(meetingRoom.PexipNode);
        }
    }
}
