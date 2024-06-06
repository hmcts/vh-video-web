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
    public class ConferenceTests
    {
        private Conference _conference;
        [SetUp]
        public void SetUp()
        {
            _conference = new Conference();
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
    }
}
