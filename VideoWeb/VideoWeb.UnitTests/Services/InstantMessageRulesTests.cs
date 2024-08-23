using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using FluentAssertions.Extensions;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Services;

namespace VideoWeb.UnitTests.Services;

public class InstantMessageRulesTests
    {
        private InstantMessageRules _instantMessageRules;
        private Mock<IUserProfileService> _userProfileServiceMock;

        [SetUp]
        public void Setup()
        {
            _userProfileServiceMock = new Mock<IUserProfileService>();
            _instantMessageRules = new InstantMessageRules(_userProfileServiceMock.Object);
        }

        [Test]
        public async Task CanExchangeMessage_Should_Return_True_When_To_Is_DefaultAdminName_And_From_Is_Participant()
        {
            // Arrange
            var conference = new Conference();
            var from = "participant1";
            var to = InstantMessageRules.DefaultAdminName;

            conference.AddParticipant(new Participant { Id = Guid.NewGuid(), Username = from });

            // Act
            var result = await _instantMessageRules.CanExchangeMessage(conference, to, from);

            // Assert
            result.Should().BeTrue();
        }

        [Test]
        public async Task CanExchangeMessage_Should_Return_True_When_From_Is_Admin_And_To_Is_Participant()
        {
            // Arrange
            var conference = new Conference();
            var from = InstantMessageRules.DefaultAdminName;
            var to = Guid.NewGuid().ToString();

            conference.AddParticipant(new Participant { Id = Guid.Parse(to), Username = "participant1" });

            _userProfileServiceMock.Setup(x => x.GetUserAsync(from, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UserProfile { IsAdmin = true });

            // Act
            var result = await _instantMessageRules.CanExchangeMessage(conference, to, from);

            // Assert
            result.Should().BeTrue();
        }

        [Test]
        public async Task CanExchangeMessage_Should_Return_False_When_To_Is_Not_DefaultAdminName_And_Is_Not_Participant()
        {
            // Arrange
            var conference = new Conference();
            var from = "participant1";
            var to = "invalid-guid";

            conference.AddParticipant(new Participant { Id = Guid.NewGuid(), Username = from });

            // Act
            var result = await _instantMessageRules.CanExchangeMessage(conference, to, from);

            // Assert
            result.Should().BeFalse();
        }

        [Test]
        public async Task CanExchangeMessage_Should_Return_False_When_To_Is_Not_Participant()
        {
            // Arrange
            var conference = new Conference();
            var from = "participant1";
            var to = Guid.NewGuid().ToString();

            // Act
            var result = await _instantMessageRules.CanExchangeMessage(conference, to, from);

            // Assert
            result.Should().BeFalse();
        }

        [Test]
        public async Task BuildSendMessageDtoFromAdmin_Should_Return_SendMessageDto()
        {
            // Arrange
            var conference = new Conference();
            var messageUuid = Guid.NewGuid();
            var message = "test message";
            var username = "admin";
            var participantId = Guid.NewGuid();

            var fromUser = new UserProfile { FirstName = "Admin" };
            _userProfileServiceMock.Setup(x => x.GetUserAsync(username, It.IsAny<CancellationToken>()))
                .ReturnsAsync(fromUser);

            var participant = new Participant { Id = participantId, Username = "participant1" };
            conference.AddParticipant(participant);

            // Act
            var result = await _instantMessageRules.BuildSendMessageDtoFromAdmin(conference, messageUuid, message, username, participantId);

            // Assert
            result.Should().NotBeNull();
            result.Conference.Should().Be(conference);
            result.Timestamp.Should().BeCloseTo(DateTime.UtcNow, 1000.Milliseconds());
            result.MessageUuid.Should().Be(messageUuid);
            result.Message.Should().Be(message);
            result.From.Should().Be(username);
            result.FromDisplayName.Should().Be(fromUser.FirstName);
            result.To.Should().Be(participantId.ToString());
            result.ParticipantUsername.Should().Be(participant.Username.ToLower());
        }

        [Test]
        public void BuildSendMessageDtoFromParticipant_Should_Return_SendMessageDto()
        {
            // Arrange
            var conference = new Conference();
            var messageUuid = Guid.NewGuid();
            var message = "test message";
            var username = "participant1";

            var participant = new Participant { Id = Guid.NewGuid(), Username = username, DisplayName = "Participant 1" };
            conference.AddParticipant(participant);

            // Act
            var result = _instantMessageRules.BuildSendMessageDtoFromParticipant(conference, messageUuid, message, username);

            // Assert
            result.Should().NotBeNull();
            result.Conference.Should().Be(conference);
            result.Timestamp.Should().BeCloseTo(DateTime.UtcNow, 1000.Milliseconds());
            result.MessageUuid.Should().Be(messageUuid);
            result.Message.Should().Be(message);
            result.From.Should().Be(username);
            result.FromDisplayName.Should().Be(participant.DisplayName);
            result.To.Should().Be(InstantMessageRules.DefaultAdminName);
            result.ParticipantUsername.Should().Be(participant.Username.ToLower());
        }
    }
