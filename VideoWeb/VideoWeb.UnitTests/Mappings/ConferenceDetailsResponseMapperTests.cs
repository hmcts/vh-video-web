using System;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Enums;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceDetailsResponseMapperTests
    {
        private ConferenceDetailsResponseMapper _sut;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<ParticipantDetailsResponse, Participant>())
                .Returns(_mocker.Create<ParticipantDetailsResponseMapper>());
            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<EndpointResponse, Endpoint>())
                .Returns(_mocker.Create<EndpointsMapper>());
            _sut = _mocker.Create<ConferenceDetailsResponseMapper>();
        }

        [Test]
        public void Should_map_all_properties()
        {
            Builder<ParticipantDetailsResponse>.CreateNew().With(x => x.UserRole = UserRole.Individual).Build();
            var participants = new List<ParticipantDetailsResponse>
            {
                Builder<ParticipantDetailsResponse>.CreateNew().With(x => x.UserRole = UserRole.Individual).Build(),
                Builder<ParticipantDetailsResponse>.CreateNew().With(x => x.UserRole = UserRole.Representative).Build(),
                Builder<ParticipantDetailsResponse>.CreateNew().With(x => x.UserRole = UserRole.Judge).Build()
            };
            var endPoints = new List<EndpointResponse>
            {
                Builder<EndpointResponse>.CreateNew().Build(),
                Builder<EndpointResponse>.CreateNew().Build(),
            };
            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Participants = participants)
                .With(x => x.Endpoints = endPoints)
                .Build();

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.Participants.Count.Should().Be(participants.Count);
            response.Endpoints.Count.Should().Be(conference.Endpoints.Count);
        }
    }
}
