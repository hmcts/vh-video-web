using System;
using System.Collections.Generic;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using Conference = VideoWeb.Services.Video.ConferenceForJudgeResponse;
using Participant = VideoWeb.Services.Video.ParticipantForJudgeResponse;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceForJudgeResponseMapperTests
    {
        protected AutoMock _mocker;
        protected ConferenceForJudgeResponseMapper _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Participant, VideoWeb.Contract.Responses.ParticipantForJudgeResponse>()).Returns(_mocker.Create<ParticipantForJudgeResponseMapper>());
            _sut = _mocker.Create<ConferenceForJudgeResponseMapper>();
        }

        [Test]
        public void Should_map_all_properties()
        {
            Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Individual).Build();
            var participants = new List<Participant>
            {
                Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Individual).Build(),
                Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Representative).Build(),
                Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Judge).Build()
            };

            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Participants = participants)
                .With(x => x.Number_of_endpoints = 2)
                .Build();

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time);
            response.ScheduledDuration.Should().Be(conference.Scheduled_duration);
            response.CaseType.Should().Be(conference.Case_type);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.CaseName.Should().Be(conference.Case_name);
            response.Status.ToString().Should().Be(conference.Status.ToString());
            response.Participants.Count.Should().Be(participants.Count);
            response.NumberOfEndpoints.Should().Be(conference.Number_of_endpoints);
        }
    }
}
