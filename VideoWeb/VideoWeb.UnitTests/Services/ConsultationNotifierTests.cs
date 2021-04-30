using System;
using System.Linq;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Services
{
    [TestFixture]
    public class ConsultationNotifierTests
    {
        private AutoMock _mocker;
        private Conference _conference;
        private ConsultationNotifier _sut;

        [SetUp]
        public void Setup()
        {
            _conference = new ConferenceCacheModelBuilder().WithLinkedParticipantsInRoom().Build();

            _conference = new ConferenceCacheModelBuilder().WithLinkedParticipantsInRoom().Build();
            _mocker = AutoMock.GetLoose();

            _mocker.Mock<IHubClients<IEventHubClient>>().Setup(x => x.Group(It.IsAny<string>()))
                .Returns(_mocker.Mock<IEventHubClient>().Object);
            _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>().Setup(x => x.Clients)
                .Returns(_mocker.Mock<IHubClients<IEventHubClient>>().Object);

            _sut = _mocker.Create<ConsultationNotifier>();
        }

        [Test]
        public async Task should_update_all_participants_on_room_updates()
        {
            // arrange
            var room = new Room {Label = "Consultation2", Locked = true, ConferenceId = _conference.Id};
            
            // act
            await _sut.NotifyRoomUpdateAsync(_conference, room);
            
            // assert
            _mocker.Mock<IEventHubClient>()
                .Verify(
                    x => x.RoomUpdate(It.Is<Room>(r =>
                        r.Locked == room.Locked && r.Label == room.Label && r.ConferenceId == room.ConferenceId)),
                    Times.Exactly(_conference.Participants.Count));
        }

        [Test]
        public async Task should_notify_participant_of_consultation_request()
        {
            // arrange
            var allNonJudgeAndNonLinkedParticipants = _conference.Participants
                .Where(x => !x.IsJudge() && !x.LinkedParticipants.Any()).ToList();
            var roomLabel = "ConsultationRoom1";
            var requestedFor = allNonJudgeAndNonLinkedParticipants[0];
            var requestedBy = allNonJudgeAndNonLinkedParticipants[1];

            // act
           var invitationId = await _sut.NotifyConsultationRequestAsync(_conference, roomLabel, requestedBy.Id, requestedFor.Id);
            
            // assert
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.RequestedConsultationMessage(_conference.Id, invitationId, roomLabel, requestedBy.Id, requestedFor.Id),
                Times.Exactly(_conference.Participants.Count));
        }
        
        [Test]
        public async Task should_notify_participant_and_linked_participants_of_consultation_request()
        {
            // arrange
            var allNonJudgeAndNonLinkedParticipants = _conference.Participants
                .Where(x => !x.IsJudge() && !x.LinkedParticipants.Any()).ToList();
            var linkedParticipant = _conference.Participants.First(x => !x.IsJudge() && x.LinkedParticipants.Any());
            var linked = _conference.Participants
                .Where(p => linkedParticipant.LinkedParticipants.Select(x => x.LinkedId).Contains(p.Id)).ToList();
            var roomLabel = "ConsultationRoom1";
            var requestedFor = linkedParticipant;
            var requestedBy = allNonJudgeAndNonLinkedParticipants[0];

            // act
            var invitationId = await _sut.NotifyConsultationRequestAsync(_conference, roomLabel, requestedBy.Id, requestedFor.Id);
            
            // assert
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.RequestedConsultationMessage(_conference.Id, invitationId, roomLabel, requestedBy.Id, requestedFor.Id),
                Times.Exactly(_conference.Participants.Count));
            
            foreach (var lp in linked)
            {
                _mocker.Mock<IEventHubClient>().Verify(
                    x => x.RequestedConsultationMessage(_conference.Id, invitationId, roomLabel, requestedBy.Id, lp.Id),
                    Times.Exactly(_conference.Participants.Count));
            }
        }
        
        [TestCase(ConsultationAnswer.None)]
        [TestCase(ConsultationAnswer.Accepted)]
        [TestCase(ConsultationAnswer.Rejected)]
        public async Task should_send_message_to_other_party_when_participant_responds(ConsultationAnswer answer)
        {
            // arrange
            var allNonJudgeAndNonLinkedParticipants = _conference.Participants
                .Where(x => !x.IsJudge() && !x.LinkedParticipants.Any()).ToList();
            var roomLabel = "ConsultationRoom1";
            var requestedFor = allNonJudgeAndNonLinkedParticipants[0];
            var expectedInvitationId = Guid.NewGuid();
            
            // act
            await _sut.NotifyConsultationResponseAsync(_conference, expectedInvitationId, roomLabel, requestedFor.Id, answer);

            // assert
            _mocker.Mock<IConsultationResponseTracker>().Verify(crt =>
                crt.UpdateConsultationResponse(expectedInvitationId, requestedFor.Id, answer), Times.Once);
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.ConsultationRequestResponseMessage(_conference.Id, expectedInvitationId, roomLabel, requestedFor.Id, answer, requestedFor.Id),
                Times.Exactly(_conference.Participants.Count));
        }

        [TestCase(ConsultationAnswer.None)]
        [TestCase(ConsultationAnswer.Failed)]
        [TestCase(ConsultationAnswer.Rejected)]
        public async Task should_send_the_initiators_id_as_responseInitiatorId_for_linked_participant_responses(ConsultationAnswer answer)
        {
            // arrange
            var participantCount = _conference.Participants.Count;
            var allLinkedParticipants = _conference.Participants.Where(x => !x.IsJudge() && x.LinkedParticipants.Any()).ToList();
            var roomLabel = "ConsultationRoom1";
            var requestedFor = allLinkedParticipants[0];
            var linkedParticipants = requestedFor.LinkedParticipants;
            var expectedInvitationId = Guid.NewGuid();

            // act
            await _sut.NotifyConsultationResponseAsync(_conference, expectedInvitationId, roomLabel, requestedFor.Id, answer);

            // assert
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.ConsultationRequestResponseMessage(_conference.Id, expectedInvitationId, roomLabel, requestedFor.Id, answer, requestedFor.Id),
                Times.Exactly(participantCount));

            foreach (var linkedParticipant in linkedParticipants) {
                _mocker.Mock<IEventHubClient>().Verify(
                    x => x.ConsultationRequestResponseMessage(_conference.Id, expectedInvitationId, roomLabel, linkedParticipant.LinkedId, answer, requestedFor.Id),
                    Times.Exactly(participantCount));
            }
        }

        [Test]
        public async Task should_send_message_to_all_parties_when_a_participant_responds()
        {
            // arrange
            var linkedParticipant = _conference.Participants.First(x => !x.IsJudge() && x.LinkedParticipants.Any());
            var roomLabel = "ConsultationRoom1";
            var answer = ConsultationAnswer.Accepted;
            var expectedInvitationId = Guid.NewGuid();

            // act
            await _sut.NotifyConsultationResponseAsync(_conference, expectedInvitationId, roomLabel, linkedParticipant.Id, answer);

            // assert
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.ConsultationRequestResponseMessage(_conference.Id, expectedInvitationId, roomLabel, linkedParticipant.Id, answer, linkedParticipant.Id),
                Times.Exactly(_conference.Participants.Count));
        }

        [Test]
        public async Task should_send_message_to_other_party_when_all_linked_participant_respond_accept()
        {
            throw new NotImplementedException();
            // // arrange
            // var linkedParticipant = _conference.Participants.First(x => !x.IsJudge() && x.LinkedParticipants.Any());
            // var linked = _conference.Participants
            //     .Where(p => linkedParticipant.LinkedParticipants.Select(x => x.LinkedId).Contains(p.Id)).ToList();
            // var roomLabel = "ConsultationRoom1";
            // var answer = ConsultationAnswer.Accepted;
            // var expectedInvitationId = Guid.NewGuid();
            //
            // foreach (var lParticipant in linked)
            // {
            //     await _consultationResponseTracker.UpdateConsultationResponse(expectedInvitationId, lParticipant.Id,
            //         ConsultationAnswer.Accepted);
            // }
            //
            // // act
            // await _sut.NotifyConsultationResponseAsync(_conference, expectedInvitationId, roomLabel, linkedParticipant.Id, answer);
            //
            // // assert
            // _mocker.Mock<IEventHubClient>()
            //     .Verify(
            //         x => x.ConsultationRequestResponseMessage(_conference.Id, expectedInvitationId, roomLabel, linkedParticipant.Id, answer, linkedParticipant.Id),
            //         Times.Exactly(_conference.Participants.Count));
            //
            // foreach (var lParticipant in linked)
            // {
            //     _mocker.Mock<IEventHubClient>().Verify(
            //         x => x.ConsultationRequestResponseMessage(_conference.Id, expectedInvitationId, roomLabel,
            //             lParticipant.Id, answer, linkedParticipant.Id),
            //         Times.Exactly(_conference.Participants.Count));
            // }
            //
            // var room = _conference.CivilianRooms.First(x => x.Participants.Contains(linkedParticipant.Id));
            // var cache = _dictionaryCache.GetCache();
            // cache.ContainsKey(room.Id).Should().BeTrue();
            // var accepted = cache[room.Id];
            // accepted.Should().Contain(linkedParticipant.Id);
            // accepted.Should().Contain(linked.Select(p => p.Id));
        }

        [Test]
        public async Task should_clear_responses_when_participant_is_being_transferred()
        {
            throw new NotImplementedException();
            // arrange
            // var linkedParticipant = _conference.Participants.First(x => !x.IsJudge() && x.LinkedParticipants.Any());
            // var linked = _conference.Participants
            //     .Where(p => linkedParticipant.LinkedParticipants.Select(x => x.LinkedId).Contains(p.Id)).ToList();
            // var roomLabel = "ConsultationRoom1";
            // var answer = ConsultationAnswer.Transferring;
            // var expectedInvitationId = Guid.NewGuid();
            //
            // await _consultationResponseTracker.UpdateConsultationResponse(expectedInvitationId, linkedParticipant.Id,
            //     ConsultationAnswer.Accepted);
            // foreach (var lParticipant in linked)
            // {
            //     await _consultationResponseTracker.UpdateConsultationResponse(expectedInvitationId, lParticipant.Id,
            //         ConsultationAnswer.Accepted);
            // }
            //
            // // act
            // await _sut.NotifyConsultationResponseAsync(_conference, expectedInvitationId, roomLabel, linkedParticipant.Id, answer);
            //
            // // assert
            // var room = _conference.CivilianRooms.First(x => x.Participants.Contains(linkedParticipant.Id));
            // var cache = _dictionaryCache.GetCache();
            // cache.ContainsKey(room.Id).Should().BeFalse();
            //
            // _dictionaryCache.GetCache().ContainsKey(room.Id).Should().BeFalse();
        }

        [TestCase(ConsultationAnswer.None)]
        [TestCase(ConsultationAnswer.Failed)]
        [TestCase(ConsultationAnswer.Rejected)]
        public async Task should_clear_responses_when_participant_doesnot_accept(ConsultationAnswer answer)
        {
            throw new NotImplementedException();
            // // arrange
            // var linkedParticipant = _conference.Participants.First(x => !x.IsJudge() && x.LinkedParticipants.Any());
            // var linked = _conference.Participants
            //     .Where(p => linkedParticipant.LinkedParticipants.Select(x => x.LinkedId).Contains(p.Id)).ToList();
            // var roomLabel = "ConsultationRoom1";
            // var expectedInvitationId = Guid.NewGuid();
            //
            // await _consultationResponseTracker.UpdateConsultationResponse(expectedInvitationId, linkedParticipant.Id,
            //     ConsultationAnswer.Accepted);
            // foreach (var lParticipant in linked)
            // {
            //     await _consultationResponseTracker.UpdateConsultationResponse(expectedInvitationId, lParticipant.Id,
            //         ConsultationAnswer.Accepted);
            // }
            //
            // // act
            // await _sut.NotifyConsultationResponseAsync(_conference, expectedInvitationId, roomLabel, linkedParticipant.Id, answer);
            //
            // // assert
            // var room = _conference.CivilianRooms.First(x => x.Participants.Contains(linkedParticipant.Id));
            // var cache = _dictionaryCache.GetCache();
            // cache.ContainsKey(room.Id).Should().BeFalse();
            //
            // _dictionaryCache.GetCache().ContainsKey(room.Id).Should().BeFalse();
        }

        [Test]
        public async Task should_notify_endpoint_transferring()
        {
            // arrange
            var roomLabel = "ConsultationRoom1";
            var endpoint = _conference.Endpoints.First();
            var expectedInvitationId = Guid.NewGuid();

            // act
            await _sut.NotifyConsultationResponseAsync(_conference, expectedInvitationId, roomLabel, endpoint.Id, ConsultationAnswer.Transferring);
            
            // assert
            _mocker.Mock<IEventHubClient>()
                .Verify(
                    x => x.ConsultationRequestResponseMessage(_conference.Id, expectedInvitationId, roomLabel, endpoint.Id, ConsultationAnswer.Transferring, endpoint.Id),
                    Times.Exactly(_conference.Participants.Count));
        }
    }
}
