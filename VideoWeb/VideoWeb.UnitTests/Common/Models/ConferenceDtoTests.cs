using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Common.Models
{
    [TestFixture]
    public class ConferenceDtoTests
    {
        private ConferenceDto _conferenceDto;
        [SetUp]
        public void SetUp()
        {
            _conferenceDto = new ConferenceDto();
        }

        [Test]
        public void Should_add_participant()
        {
            // Arrange
            var participant1 = new ParticipantDto();
            participant1.Id = new Guid();
            participant1.Username = "Participant1UserName";

            var participant2 = new ParticipantDto();
            participant2.Id = new Guid();
            participant2.Username = "Participant2UserName";

            var startingList = new List<ParticipantDto> { 
                participant1  
            };

            _conferenceDto.Participants = new List<ParticipantDto>(startingList);

            // Act
            _conferenceDto.AddParticipant(participant2);

            // Assert
            _conferenceDto.Participants.Should().HaveCount(startingList.Count + 1);
            _conferenceDto.Participants.Should().Contain(participant2);
        }

        [TestCase(3, 2, HearingLayout.Dynamic)]
        [TestCase(3, 3, HearingLayout.OnePlus7)]
        [TestCase(6, 3, HearingLayout.OnePlus7)]
        [TestCase(6, 4, HearingLayout.TwoPlus21)]
        public void Should_return_correct_layout_for_the_number_of_participants_and_endpoints(int numberOfParticipants, int numberOfEndpoints, HearingLayout expectedLayout)
        {
            // Arrange
            _conferenceDto.Participants = Builder<ParticipantDto>.CreateListOfSize(numberOfParticipants).Build().ToList();
            _conferenceDto.Endpoints = Builder<EndpointDto>.CreateListOfSize(numberOfEndpoints).Build().ToList();

            // Act
            var recommendedLayout = _conferenceDto.GetRecommendedLayout();

            // Assert
            recommendedLayout.Should().Be(expectedLayout);
        }
    }
}
