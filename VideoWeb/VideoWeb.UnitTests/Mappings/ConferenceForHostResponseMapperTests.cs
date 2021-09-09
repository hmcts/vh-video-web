using System;
using System.Collections.Generic;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoWeb.Mappings;
using Conference = VideoApi.Contract.Responses.ConferenceForHostResponse;
using Participant = VideoApi.Contract.Responses.ParticipantForHostResponse;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceForHostResponseMapperTests
    {
        protected AutoMock _mocker;
        protected ConferenceForHostResponseMapper _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Participant, Contract.Responses.ParticipantForJudgeResponse>()).Returns(_mocker.Create<ParticipantForJudgeResponseMapper>());
            _sut = _mocker.Create<ConferenceForHostResponseMapper>();
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
                .With(x => x.NumberOfEndpoints = 2)
                .With(x => x.ClosedDateTime = DateTime.UtcNow.AddMinutes(-10))
                .Build();

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
            response.ClosedDateTime.Should().HaveValue().And.Be(conference.ClosedDateTime);
            response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
            response.CaseType.Should().Be(conference.CaseType);
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.CaseName.Should().Be(conference.CaseName);
            response.Status.ToString().Should().Be(conference.Status.ToString());
            response.Participants.Count.Should().Be(participants.Count);
            response.NumberOfEndpoints.Should().Be(conference.NumberOfEndpoints);
        }
    }
}
