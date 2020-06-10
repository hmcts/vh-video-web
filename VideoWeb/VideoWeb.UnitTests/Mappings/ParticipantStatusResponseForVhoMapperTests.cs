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
using ParticipantResponse = VideoWeb.Services.Bookings.ParticipantResponse;

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
            
            var bookingParticipants = new List<ParticipantResponse>
            {
                new ParticipantResponse{Id = judge1.RefId, First_name = "judge1", Last_name = "judge1", Contact_email = "judge1", Telephone_number = "judge1"},
                new ParticipantResponse{Id = judge2.RefId, First_name = "judge2", Last_name = "judge2", Contact_email = "judge2", Telephone_number = "judge2"},
                new ParticipantResponse{Id = judge3.RefId, First_name = "judge3", Last_name = "judge3", Contact_email = "judge3", Telephone_number = "judge3"}
            };
            
            var judgesInHearings = new List<JudgeInHearingResponse>
            {
                new JudgeInHearingResponse{ Id = judge3DifferentHearing.Id, Username = judge3.Username, Status = ParticipantState.InHearing }
            };

            var results = ParticipantStatusResponseForVhoMapper
                .MapParticipantsTo(conference, bookingParticipants, judgesInHearings).ToList();
            
            AssertResponseItem(results.ElementAt(0), conference.Participants[0], conferenceId, bookingParticipants[0], false);
            AssertResponseItem(results.ElementAt(1), conference.Participants[1], conferenceId, bookingParticipants[1], false);
            AssertResponseItem(results.ElementAt(2), conference.Participants[2], conferenceId, bookingParticipants[2], true);
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

            var bookingParticipants = new List<ParticipantResponse>
            {
                new ParticipantResponse{Id = Guid.NewGuid(), First_name = "judge1", Last_name = "judge1", Contact_email = "judge1", Telephone_number = "judge1"},
            };

            var judgesInHearings = new List<JudgeInHearingResponse>
            {
                new JudgeInHearingResponse{ Id = judge3DifferentHearing.Id, Username = judge3.Username, Status = ParticipantState.InHearing }
            };

            var results = ParticipantStatusResponseForVhoMapper
                .MapParticipantsTo(conference, bookingParticipants, judgesInHearings).ToList();

            AssertResponseItemWithNoBookingParticipants(results.ElementAt(0), conference.Participants[0], conferenceId, false);
        }

        [Test]
        public void Should_throw_exception_if_have_two_participants_with_the_same_id()
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
            
            var bookingParticipants = new List<ParticipantResponse>
            {
                new ParticipantResponse{Id = judge1.RefId, First_name = "judge1", Last_name = "judge1", Contact_email = "judge1", Telephone_number = "judge1"},
                new ParticipantResponse{Id = judge2.RefId, First_name = "judge2", Last_name = "judge2", Contact_email = "judge2", Telephone_number = "judge2"},
                new ParticipantResponse{Id = judge3.RefId, First_name = "judge3", Last_name = "judge3", Contact_email = "judge3", Telephone_number = "judge3"}
            };
            
            var judgesInHearings = new List<JudgeInHearingResponse>
            {
                new JudgeInHearingResponse{ Id = judge3DifferentHearing.Id, Username = judge3.Username, Status = ParticipantState.InHearing }
            };

            bookingParticipants[0].Id = judge1.RefId;
            bookingParticipants[1].Id = judge1.RefId;

            Assert.Throws<InvalidOperationException>(() =>
                ParticipantStatusResponseForVhoMapper.MapParticipantsTo(conference, bookingParticipants, judgesInHearings));
        }
        
        private static void AssertResponseItem(ParticipantContactDetailsResponseVho response, Participant participant, 
            Guid conferenceId, ParticipantResponse bookingParticipant, bool isInAnotherHearing)
        {
            response.Id.Should().Be(participant.Id);
            response.ConferenceId.Should().Be(conferenceId);
            response.Name.Should().Be(participant.Name);
            response.Role.Should().Be(participant.Role);
            response.Username.Should().Be(participant.Username);
            response.CaseTypeGroup.Should().Be(participant.CaseTypeGroup);
            response.RefId.Should().Be(participant.RefId);
            response.FirstName.Should().Be(bookingParticipant.First_name);
            response.LastName.Should().Be(bookingParticipant.Last_name);
            response.DisplayName.Should().Be(participant.DisplayName);
            response.Status.Should().Be(participant.ParticipantStatus);
            response.ContactEmail.Should().Be(bookingParticipant.Contact_email);
            response.ContactTelephone.Should().Be(bookingParticipant.Telephone_number);
            response.HearingVenueName.Should().Be("MyVenue");
            response.JudgeInAnotherHearing.Should().Be(isInAnotherHearing);
        }

        private static void AssertResponseItemWithNoBookingParticipants(ParticipantContactDetailsResponseVho response, Participant participant,
            Guid conferenceId, bool isInAnotherHearing)
        {
            response.Id.Should().Be(participant.Id);
            response.ConferenceId.Should().Be(conferenceId);
            response.Name.Should().Be(participant.Name);
            response.Role.Should().Be(participant.Role);
            response.Username.Should().Be(participant.Username);
            response.CaseTypeGroup.Should().Be(participant.CaseTypeGroup);
            response.RefId.Should().Be(participant.RefId);
            response.FirstName.Should().BeNullOrEmpty();
            response.LastName.Should().BeNullOrEmpty();
            response.DisplayName.Should().Be(participant.DisplayName);
            response.Status.Should().Be(participant.ParticipantStatus);
            response.ContactEmail.Should().BeNullOrEmpty();
            response.ContactTelephone.Should().BeNullOrEmpty();
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
