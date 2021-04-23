using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Helpers;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Services
{
    public class ConsultationResponseTrackerTests
    {
        private ConsultationResponseTracker _sut;
        private Conference _conference;
        private IConsultationResponseCache _cache;

        [SetUp]
        public void Setup()
        {
            _cache = new DictionaryConsultationResponseCache();
            _conference = new ConferenceCacheModelBuilder().WithLinkedParticipantsInRoom().Build();
            _sut = new ConsultationResponseTracker(_cache);
        }
        
        [Test]
        public async Task should_not_track_response_for_participants_not_linked()
        {
            // arrange
            var participant = _conference.Participants.First(x => !x.IsJudge() && !x.LinkedParticipants.Any());
            
            // act
            await _sut.UpdateConsultationResponse(_conference, participant.Id, ConsultationAnswer.Accepted);
            
            // assert
            foreach (var room in _conference.CivilianRooms)
            {
                var acceptedResponses = await _cache.GetResponses(room.Id);
                acceptedResponses.Should().BeEmpty();
            }
        }
        
        [Test]
        public async Task should_return_true_all_participants_have_accepted_for_participants_not_linked()
        {
            // arrange
            var participant = _conference.Participants.First(x => !x.IsJudge() && !x.LinkedParticipants.Any());
            
            // act
            var result = await _sut.HaveAllParticipantsAccepted(_conference, participant.Id);
            
            // assert
            result.Should().BeTrue();
        }

        [Test]
        public async Task should_return_false_when_no_participants_have_accepted()
        {
            // arrange
            var interpreterRoom = _conference.CivilianRooms.First();
            var participants = _conference.Participants.Where(p => interpreterRoom.Participants.Contains(p.Id))
                .ToList();
            
            // act
            var result = await _sut.HaveAllParticipantsAccepted(_conference, participants[0].Id);
            
            // assert
            result.Should().BeFalse();
        }
        
        [Test]
        public async Task should_return_false_when_not_all_participants_have_accepted()
        {
            // arrange
            var interpreterRoom = _conference.CivilianRooms.First();
            var participants = _conference.Participants.Where(p => interpreterRoom.Participants.Contains(p.Id))
                .ToList();
            
            await _sut.UpdateConsultationResponse(_conference, participants[0].Id, ConsultationAnswer.Accepted);
            
            // act
            var result = await _sut.HaveAllParticipantsAccepted(_conference, participants[0].Id);
            
            // assert
            result.Should().BeFalse();
        }
        
        [Test]
        public async Task should_return_true_when_all_participants_have_accepted()
        {
            // arrange
            var interpreterRoom = _conference.CivilianRooms.First();
            var participants = _conference.Participants.Where(p => interpreterRoom.Participants.Contains(p.Id))
                .ToList();
            foreach (var participant in participants)
            {
                await _sut.UpdateConsultationResponse(_conference, participant.Id, ConsultationAnswer.Accepted);
            }
            
            // act
            var result = await _sut.HaveAllParticipantsAccepted(_conference, participants[0].Id);

            // assert
            result.Should().BeTrue();
        }

        [Test]
        public async Task should_clear_all_accepted_responses_when_one_participant_rejects()
        {
            // arrange
            var interpreterRoom = _conference.CivilianRooms.First();
            var participants = _conference.Participants.Where(p => interpreterRoom.Participants.Contains(p.Id))
                .ToList();
            foreach (var participant in participants.Skip(1))
            {
                await _sut.UpdateConsultationResponse(_conference, participant.Id, ConsultationAnswer.Accepted);
            }
            await _sut.UpdateConsultationResponse(_conference, participants[0].Id, ConsultationAnswer.Rejected);
            
            // act
            var result = await _sut.HaveAllParticipantsAccepted(_conference, participants[0].Id);

            // assert
            result.Should().BeFalse();
            
        }        
    }
}
