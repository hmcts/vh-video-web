using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using FluentAssertions.Extensions;
using Moq;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class ChatResponseMapperTests
    {
        
        private ChatResponseMapper _mapper;
        private Mock<IUserApiClient> _userApiClientMock;
        private ConferenceDetailsResponse _conference;
        private readonly string _username = "john@doe.com";
        private readonly string _displayName = "Johnny Doe";

        [SetUp]
        public void Setup()
        {
            _userApiClientMock = new Mock<IUserApiClient>();
            _mapper = new ChatResponseMapper(_userApiClientMock.Object);
            _conference = CreateConferenceResponse(_username, _displayName);
        }
        
        [Test]
        public async Task should_map_all_properties_and_is_user_true()
        {
            var message = new MessageResponse
            {
                From = _username,
                Message_text = "test message from john",
                Time_stamp = DateTime.Now.AsUtc()
            };

            var response = await _mapper.MapToResponseModel(message, _conference, _username);
            response.From.Should().Be(_displayName);
            response.Message.Should().Be(message.Message_text);
            response.Timestamp.Should().Be(message.Time_stamp);
            response.IsUser.Should().BeTrue();
        }

        [Test]
        public async Task should_map_all_properties_and_is_user_false()
        {
            var otherUser = "someone@else.com";

            var userProfile = new UserProfile
            {
                First_name = "Someone",
                Last_name = "Else",
                User_name = otherUser,
                Display_name = "Some other user display",
                Email = "else@someone.net",
                User_role = UserRole.VideoHearingsOfficer.ToString()
            };
            _userApiClientMock.Setup(x => x.GetUserByAdUserNameAsync(otherUser)).ReturnsAsync(userProfile);
            var message = new MessageResponse
            {
                From = otherUser,
                Message_text = "test message from john",
                Time_stamp = DateTime.Now.AsUtc()
            };

            var response = await _mapper.MapToResponseModel(message, _conference, _username);
            response.From.Should().Be(userProfile.First_name);
            response.Message.Should().Be(message.Message_text);
            response.Timestamp.Should().Be(message.Time_stamp);
            response.IsUser.Should().BeFalse();
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
