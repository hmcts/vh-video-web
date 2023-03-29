using System;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Services.ParticipantService
{
    public class CanStaffMemberJoinConferenceTests
    {
        private AutoMock _mocker;
        private VideoWeb.Services.ParticipantService _service;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _service = _mocker.Create<VideoWeb.Services.ParticipantService>();
        }
        
        [Test]
        public void Should_return_true_when_hearing_is_starting_soon()
        {
            // arrange
            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x=> x.ScheduledDateTime, DateTime.UtcNow)
                .Build();
            conference.ScheduledDateTime = DateTime.UtcNow;
            
            // act
            var result = _service.CanStaffMemberJoinConference(conference);
            
            // assert
            result.Should().BeTrue();
        }

        [Test]
        public void Should_return_false_when_hearing_is_starting_soon()
        {
            // arrange
            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x=> x.ScheduledDateTime, DateTime.UtcNow.AddHours(1))
                .With(x=> x.ClosedDateTime, DateTime.UtcNow.AddHours(-3))
                .Build();
            
            // act
            var result = _service.CanStaffMemberJoinConference(conference);
            
            // assert
            result.Should().BeFalse();
        }
    }
}
