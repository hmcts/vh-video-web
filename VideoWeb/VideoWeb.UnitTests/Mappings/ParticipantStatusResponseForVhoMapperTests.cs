using System;
using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantStatusResponseForVhoMapperTests
    {

        [Test]
        public void Should_map_all_properties()
        {
            var conferenceId = Guid.NewGuid();
            var conference = CreateValidConference(conferenceId);

            var judge1 = CreateParticipant("judge1");
            var judge2 = CreateParticipant("judge2");
            var judge3 = CreateParticipant("judge3");
            var judge3DifferentHearing = CreateParticipant("judge3");
            conference.Participants = new List<Participant>
            {
                judge1, judge2, judge3
            };

            var judgesInHearings = new List<JudgeInHearingResponse>
            {
                new JudgeInHearingResponse
                    {Id = judge3DifferentHearing.Id, Username = judge3.Username, Status = ParticipantState.InHearing}
            };

            var results = ParticipantStatusResponseForVhoMapper
                .MapParticipantsTo(conference, judgesInHearings).ToList();

            AssertResponseItem(results.ElementAt(0), conference.Participants[0], conferenceId, false);
            AssertResponseItem(results.ElementAt(1), conference.Participants[1], conferenceId, false);
            AssertResponseItem(results.ElementAt(2), conference.Participants[2], conferenceId, true);
        }

        [Test]
        public void Should_map_all_properties_with_not_matching_booking_participants()
        {
            var conferenceId = Guid.NewGuid();
            var conference = CreateValidConference(conferenceId);

            var judge1 = CreateParticipant("judge1");
            var judge2 = CreateParticipant("judge2");
            var judge3 = CreateParticipant("judge3");
            var judge3DifferentHearing = CreateParticipant("judge3");
            conference.Participants = new List<Participant>
            {
                judge1, judge2, judge3
            };

            var judgesInHearings = new List<JudgeInHearingResponse>
            {
                new JudgeInHearingResponse{ Id = judge3DifferentHearing.Id, Username = judge3.Username, Status = ParticipantState.InHearing }
            };

            var results = ParticipantStatusResponseForVhoMapper
                .MapParticipantsTo(conference, judgesInHearings).ToList();

            AssertResponseItem(results.ElementAt(0), conference.Participants[0], conferenceId, false);
        }
        
        private static void AssertResponseItem(ParticipantContactDetailsResponseVho response, Participant participant, 
            Guid conferenceId, bool isInAnotherHearing)
        {
            response.Id.Should().Be(participant.Id);
            response.ConferenceId.Should().Be(conferenceId);
            response.Name.Should().Be(participant.Name);
            response.Role.Should().Be(participant.Role);
            response.Username.Should().Be(participant.Username);
            response.CaseTypeGroup.Should().Be(participant.CaseTypeGroup);
            response.RefId.Should().Be(participant.RefId);
            response.FirstName.Should().Be(participant.FirstName);
            response.LastName.Should().Be(participant.LastName);
            response.DisplayName.Should().Be(participant.DisplayName);
            response.Status.Should().Be(participant.ParticipantStatus);
            response.ContactEmail.Should().Be(participant.ContactEmail);
            response.ContactTelephone.Should().Be(participant.ContactTelephone);
            response.HearingVenueName.Should().Be("MyVenue");
            response.JudgeInAnotherHearing.Should().Be(isInAnotherHearing);
        }

        private static Participant CreateParticipant(string username)
        {
            return Builder<Participant>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Name = username)
                .With(x => x.Role = Role.Judge)
                .With(x => x.Username = username)
                .With(x => x.CaseTypeGroup == ParticipantStatus.Available.ToString())
                .With(x => x.RefId = Guid.NewGuid())
                .With(x => x.DisplayName = $"{username} {username}")
                .Build();
        }

        private static Conference CreateValidConference(Guid conferenceId)
        {
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.HearingId = Guid.NewGuid())
                .With(x => x.HearingVenueName = "MyVenue")
                .Build();
            
            return conference;
        }
    }
}
