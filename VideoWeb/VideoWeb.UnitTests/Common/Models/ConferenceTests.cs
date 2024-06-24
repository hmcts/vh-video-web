using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Common.Models
{
    [TestFixture]
    public class ConferenceTests
    {
        private Conference _conference;
        private ConsultationRoom _consultationRoom;
        
        [SetUp]
        public void SetUp()
        {
            _conference = new Conference();
            _consultationRoom = new ConsultationRoom
            {
                Label = "JudgeConsultationRoom3"
            };
        }

        [Test]
        public void Should_add_participant()
        {
            // Arrange
            var participant1 = new Participant();
            participant1.Id = new Guid();
            participant1.Username = "Participant1UserName";

            var participant2 = new Participant();
            participant2.Id = new Guid();
            participant2.Username = "Participant2UserName";

            var startingList = new List<Participant> { 
                participant1  
            };

            _conference.Participants = new List<Participant>(startingList);

            // Act
            _conference.AddParticipant(participant2);

            // Assert
            _conference.Participants.Should().HaveCount(startingList.Count + 1);
            _conference.Participants.Should().Contain(participant2);
        }

        [TestCase(3, 2, HearingLayout.Dynamic)]
        [TestCase(3, 3, HearingLayout.OnePlus7)]
        [TestCase(6, 3, HearingLayout.OnePlus7)]
        [TestCase(6, 4, HearingLayout.TwoPlus21)]
        public void Should_return_correct_layout_for_the_number_of_participants_and_endpoints(int numberOfParticipants, int numberOfEndpoints, HearingLayout expectedLayout)
        {
            // Arrange
            _conference.Participants = Builder<Participant>.CreateListOfSize(numberOfParticipants).Build().ToList();
            _conference.Endpoints = Builder<Endpoint>.CreateListOfSize(numberOfEndpoints).Build().ToList();

            // Act
            var recommendedLayout = _conference.GetRecommendedLayout();

            // Assert
            recommendedLayout.Should().Be(expectedLayout);
        }

        [Test]
        public void RemoveParticipantFromConsultationRoom_RemovesRoom_When_Room_Is_Empty()
        {
            // Arrange
            var participantToRemove = new Participant
            {
                Id = Guid.NewGuid()
            };
            _conference.AddParticipantToConsultationRoom(_consultationRoom.Label, participantToRemove);
            
            // Act
            _conference.RemoveParticipantFromConsultationRoom(participantToRemove, _consultationRoom.Label);
            
            // Assert
            _conference.ConsultationRooms.Count.Should().Be(0);
            participantToRemove.CurrentRoom.Should().BeNull();
        }

        [Test]
        public void RemoveParticipantFromConsultationRoom_DoesNotRemoveRoom_When_Room_Contains_Participants()
        {
            // Arrange
            AddParticipantsToConsultationRoom(5);
            
            var participantToRemove = _conference.Participants[0];
            
            // Act
            _conference.RemoveParticipantFromConsultationRoom(participantToRemove, _consultationRoom.Label);
            
            // Assert
            _conference.ConsultationRooms.Count.Should().Be(1);
            participantToRemove.CurrentRoom.Should().BeNull();
        }
        
        [Test]
        public void RemoveParticipantFromConsultationRoom_DoesNotRemoveRoom_When_Room_Contains_Endpoints()
        {
            // Arrange
            AddParticipantsToConsultationRoom(1);
            AddEndpointsToConsultationRoom(5);
            
            var participantToRemove = _conference.Participants[0];
            
            // Act
            _conference.RemoveParticipantFromConsultationRoom(participantToRemove, _consultationRoom.Label);
            
            // Assert
            _conference.ConsultationRooms.Count.Should().Be(1);
            participantToRemove.CurrentRoom.Should().BeNull();
        }
        
        [Test]
        public void RemoveEndpointFromConsultationRoom_RemovesRoom_When_Room_Is_Empty()
        {
            // Arrange
            var endpointToRemove = new Endpoint
            {
                Id = Guid.NewGuid()
            };
            _conference.AddEndpointToConsultationRoom(_consultationRoom.Label, endpointToRemove);
            
            // Act
            _conference.RemoveEndpointFromConsultationRoom(endpointToRemove, _consultationRoom.Label);
            
            // Assert
            _conference.ConsultationRooms.Count.Should().Be(0);
            endpointToRemove.CurrentRoom.Should().BeNull();
        }

        [Test]
        public void RemoveEndpointFromConsultationRoom_DoesNotRemoveRoom_When_Room_Contains_Participants()
        {
            // Arrange
            AddParticipantsToConsultationRoom(5);
            AddEndpointsToConsultationRoom(1);
            
            var endpointToRemove = _conference.Endpoints[0];
            
            // Act
            _conference.RemoveEndpointFromConsultationRoom(endpointToRemove, _consultationRoom.Label);
            
            // Assert
            _conference.ConsultationRooms.Count.Should().Be(1);
            endpointToRemove.CurrentRoom.Should().BeNull();
        }
        
        [Test]
        public void RemoveEndpointFromConsultationRoom_DoesNotRemoveRoom_When_Room_Contains_Endpoints()
        {
            // Arrange
            AddEndpointsToConsultationRoom(5);
            
            var endpointToRemove = _conference.Endpoints[0];
            
            // Act
            _conference.RemoveEndpointFromConsultationRoom(endpointToRemove, _consultationRoom.Label);
            
            // Assert
            _conference.ConsultationRooms.Count.Should().Be(1);
            endpointToRemove.CurrentRoom.Should().BeNull();
        }

        private void AddParticipantsToConsultationRoom(int numberOfParticipants)
        {
            _conference.Participants = Builder<Participant>.CreateListOfSize(numberOfParticipants).Build().ToList();
            
            foreach (var participant in _conference.Participants)
            {
                _conference.AddParticipantToConsultationRoom(_consultationRoom.Label, participant);
            }
        }

        private void AddEndpointsToConsultationRoom(int numberOfEndpoints)
        {
            _conference.Endpoints = Builder<Endpoint>.CreateListOfSize(numberOfEndpoints).Build().ToList();
            
            foreach (var endpoint in _conference.Endpoints)
            {
                _conference.AddEndpointToConsultationRoom(_consultationRoom.Label, endpoint);
            }
        }
    }
}
