using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Helpers;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Enums;
using VideoWeb.Common;
using System.Collections.Generic;

namespace VideoWeb.UnitTests.Mappings
{
    public class MessageFromDecoderTests
    {
        private MessageFromDecoder _decoder;
        private DistributedUserProfileCache _userCache;
        private IUserProfileService _userProfileService;
        private Mock<IUserProfileService> _userProfileServiceMock;

        [SetUp]
        public void Setup()
        {
            _userProfileServiceMock = new Mock<IUserProfileService>();
            _userProfileService = _userProfileServiceMock.Object;
            _decoder = new MessageFromDecoder(_userProfileService);
        }

        [Test]
        public void Should_return_true_when_message_is_from_provided_username()
        {
            var loggedInUsername = "john@hmcts.net";

            var message = new InstantMessageResponse
            {
                From = loggedInUsername, MessageText = "test", TimeStamp = DateTime.UtcNow
            };
            var result = _decoder.IsMessageFromUser(message, loggedInUsername);
            result.Should().BeTrue();
        }

        [Test]
        public void Should_return_false_when_message_is_from_another_user()
        {
            var loggedInUsername = "john@hmcts.net";
            var otherUsername = "someone@else.com";

            var message = new InstantMessageResponse
            {
                From = otherUsername, MessageText = "test", TimeStamp = DateTime.UtcNow
            };
            var result = _decoder.IsMessageFromUser(message, loggedInUsername);
            result.Should().BeFalse();
        }

        [Test]
        public async Task Should_get_participant_display_name_when_message_from_participant_in_conference()
        {
            const string loggedInUsername = "john@hmcts.net";
            const string displayName = "johnny";
            var conference = CreateConferenceResponse(loggedInUsername, displayName);

            var message = new InstantMessageResponse
            {
                From = loggedInUsername, MessageText = "test", TimeStamp = DateTime.UtcNow
            };

            var result = await _decoder.GetMessageOriginatorAsync(conference, message);
            result.Should().BeEquivalentTo(displayName);
        }

        [Test]
        public async Task Should_get_first_name_from_ad_when_message_from_non_participant()
        {
            var nonParticipantUsername = "someone@else.com";
            var userProfile = new VideoWeb.Common.Models.UserProfile
            {
                FirstName = "Someone",
                LastName = "Else",
                UserName = nonParticipantUsername,
                DisplayName = "Some other user display",
                Email = "else@someone.net",
                Roles = new List<Role> { Role.VideoHearingsOfficer }
            };

            var loggedInUsername = "john@hmcts.net";
            var displayName = "johnny";
            var conference = CreateConferenceResponse(loggedInUsername, displayName);

            var message = new InstantMessageResponse
            {
                From = nonParticipantUsername, MessageText = "test", TimeStamp = DateTime.UtcNow
            };
            _userProfileServiceMock.Setup(x => x.GetUserAsync(nonParticipantUsername)).ReturnsAsync(userProfile);
            var result = await _decoder.GetMessageOriginatorAsync(conference, message);
            result.Should().BeEquivalentTo(userProfile.FirstName);
        }

        [Test]
        public async Task Should_get_first_name_when_user_is_not_found_in_the_confeerence_and_cache()
        {
            var nonCachedUsername = "manual.panelmember_1123@test.net";
            var userProfile = new UserProfile
            {
                FirstName = "manual",
                LastName = "panelmember_1123",
                UserName = nonCachedUsername,
                DisplayName = "Some other user display",
                Email = "else@someone.net",
                Roles = new List<Role> { Role.VideoHearingsOfficer }
            };

            var loggedInUsername = "john@hmcts.net";
            var displayName = "johnny";
            var conference = CreateConferenceResponse(loggedInUsername, displayName);

            var message = new InstantMessageResponse
            {
                From = nonCachedUsername, MessageText = "test", TimeStamp = DateTime.UtcNow
            };
            var result = await _decoder.GetMessageOriginatorAsync(conference, message);
            result.Should().BeEquivalentTo(userProfile.FirstName);
        }

        [Test]
        public async Task Should_get_first_name_when_user_is_not_found_in_the_confeerence_and_cache_and_no_dot_in_username()
        {
            var nonCachedUsername = "manual@test.net";
            var userProfile = new UserProfile
            {
                FirstName = "manual",
                LastName = "panelmember_1123",
                UserName = nonCachedUsername,
                DisplayName = "Some other user display",
                Email = "else@someone.net",
                Roles = new List<Role> { Role.VideoHearingsOfficer }
            };

            var loggedInUsername = "john@hmcts.net";
            var displayName = "johnny";
            var conference = CreateConferenceResponse(loggedInUsername, displayName);

            var message = new InstantMessageResponse
            {
                From = nonCachedUsername, MessageText = "test", TimeStamp = DateTime.UtcNow
            };
            var result = await _decoder.GetMessageOriginatorAsync(conference, message);
            result.Should().BeEquivalentTo(userProfile.FirstName);
        }



        private static Conference CreateConferenceResponse(string username, string displayName)
        {
            var participants = Builder<Participant>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Username = username)
                .With(x => x.DisplayName = displayName)
                .Build().ToList();

            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Participants = participants)
                .Build();

            return conference;
        }
    }
}
