using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Services;
using VideoWeb.UnitTests.Builders;
using VideoWeb.UnitTests.Extensions;

namespace VideoWeb.UnitTests.Services
{
    public class ConsultationResponseTrackerTests
    {
        private ConsultationResponseTracker _sut;
        private Conference _conference;

        [SetUp]
        public void Setup()
        {
            _conference = new ConferenceCacheModelBuilder().WithLinkedParticipantsInRoom().Build();
            _sut = new ConsultationResponseTracker();
        }
        
        [Test]
        public void should_not_track_response_for_participants_not_linked()
        {
            // arrange
            var participant = _conference.Participants.First(x => !x.IsJudge() && !x.LinkedParticipants.Any());
            
            // act
            _sut.UpdateConsultationResponse(_conference, participant.Id, ConsultationAnswer.Accepted);
            
            // assert
            _sut.RetrieveAcceptedConsultations().Should().BeEmpty();
        }
        
        [Test]
        public void should_return_true_all_participants_have_accepted_for_participants_not_linked()
        {
            // arrange
            var participant = _conference.Participants.First(x => !x.IsJudge() && !x.LinkedParticipants.Any());
            
            // act
            var result = _sut.HaveAllParticipantsAccepted(_conference, participant.Id);
            
            // assert
            result.Should().BeTrue();
        }

        [Test]
        public void should_return_false_when_no_participants_have_accepted()
        {
            // arrange
            var interpreterRoom = _conference.CivilianRooms.First();
            var participants = _conference.Participants.Where(p => interpreterRoom.Participants.Contains(p.Id))
                .ToList();
            
            // act
            var result = _sut.HaveAllParticipantsAccepted(_conference, participants[0].Id);
            
            // assert
            result.Should().BeFalse();
        }
        
        [Test]
        public void should_return_false_when_not_all_participants_have_accepted()
        {
            // arrange
            var interpreterRoom = _conference.CivilianRooms.First();
            var participants = _conference.Participants.Where(p => interpreterRoom.Participants.Contains(p.Id))
                .ToList();
            
            _sut.UpdateConsultationResponse(_conference, participants[0].Id, ConsultationAnswer.Accepted);
            
            // act
            var result = _sut.HaveAllParticipantsAccepted(_conference, participants[0].Id);
            
            // assert
            result.Should().BeFalse();
        }
        
        [Test]
        public void should_return_true_when_all_participants_have_accepted()
        {
            // arrange
            var interpreterRoom = _conference.CivilianRooms.First();
            var participants = _conference.Participants.Where(p => interpreterRoom.Participants.Contains(p.Id))
                .ToList();
            foreach (var participant in participants)
            {
                _sut.UpdateConsultationResponse(_conference, participant.Id, ConsultationAnswer.Accepted);
            }
            
            // act
            var result = _sut.HaveAllParticipantsAccepted(_conference, participants[0].Id);

            // assert
            result.Should().BeTrue();
        }

        [Test]
        public void should_clear_all_accepted_responses_when_one_participant_rejects()
        {
            // arrange
            var interpreterRoom = _conference.CivilianRooms.First();
            var participants = _conference.Participants.Where(p => interpreterRoom.Participants.Contains(p.Id))
                .ToList();
            foreach (var participant in participants.Skip(1))
            {
                _sut.UpdateConsultationResponse(_conference, participant.Id, ConsultationAnswer.Accepted);
            }
            _sut.UpdateConsultationResponse(_conference, participants[0].Id, ConsultationAnswer.Rejected);
            
            // act
            var result = _sut.HaveAllParticipantsAccepted(_conference, participants[0].Id);

            // assert
            result.Should().BeFalse();
        }
        
    }
}
