using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class MessageFromDecoderTests
    {
        private Mock<IUserApiClient> _userApiClientMock;
        private MessageFromDecoder _decoder;

        [SetUp]
        public void Setup()
        {
            _userApiClientMock = new Mock<IUserApiClient>();
            _decoder = new MessageFromDecoder(_userApiClientMock.Object);
        }

        [Test]
        public void should_return_true_when_message_is_from_provided_username()
        {
            var loggedInUsername = "john@doe.com";

            var message = new InstantMessageResponse
            {
                From = loggedInUsername, Message_text = "test", Time_stamp = DateTime.UtcNow
            };
            var result = _decoder.IsMessageFromUser(message, loggedInUsername);
            result.Should().BeTrue();
        }

        [Test]
        public void should_return_false_when_message_is_from_another_user()
        {
            var loggedInUsername = "john@doe.com";
            var otherUsername = "someone@else.com";

            var message = new InstantMessageResponse
            {
                From = otherUsername, Message_text = "test", Time_stamp = DateTime.UtcNow
            };
            var result = _decoder.IsMessageFromUser(message, loggedInUsername);
            result.Should().BeFalse();
        }

        [Test]
        public async Task should_get_participant_display_name_when_message_from_participant_in_conference()
        {
            var loggedInUsername = "john@doe.com";
            var displayName = "johnny";
            var conference = CreateConferenceResponse(loggedInUsername, displayName);

            var message = new InstantMessageResponse
            {
                From = loggedInUsername, Message_text = "test", Time_stamp = DateTime.UtcNow
            };

            var result = await _decoder.GetMessageOriginatorAsync(conference, message);
            result.Should().BeEquivalentTo(displayName);
        }

        [Test]
        public async Task should_get_first_name_from_ad_when_message_from_non_participant()
        {
            var nonParticipantUsername = "someone@else.com";
            var userProfile = new UserProfile
            {
                First_name = "Someone",
                Last_name = "Else",
                User_name = nonParticipantUsername,
                Display_name = "Some other user display",
                Email = "else@someone.net",
                User_role = UserRole.VideoHearingsOfficer.ToString()
            };
            _userApiClientMock.Setup(x => x.GetUserByAdUserNameAsync(nonParticipantUsername)).ReturnsAsync(userProfile);

            var loggedInUsername = "john@doe.com";
            var displayName = "johnny";
            var conference = CreateConferenceResponse(loggedInUsername, displayName);

            var message = new InstantMessageResponse
            {
                From = nonParticipantUsername, Message_text = "test", Time_stamp = DateTime.UtcNow
            };

            var result = await _decoder.GetMessageOriginatorAsync(conference, message);
            result.Should().BeEquivalentTo(userProfile.First_name);
        }

        private ConferenceDetailsResponse CreateConferenceResponse(string username, string displayName)
        {
            var participants = Builder<ParticipantDetailsResponse>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Username = username)
                .With(x => x.Display_name = displayName)
                .Build().ToList();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Participants = participants)
                .Build();
            return conference;
        }
    }
}
