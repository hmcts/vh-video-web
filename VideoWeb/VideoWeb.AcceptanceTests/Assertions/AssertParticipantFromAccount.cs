using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Testing.Common.Configuration;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Assertions
{
    public class AssertParticipantFromAccount
    {
        private UserAccount _user;

        public AssertParticipantFromAccount User(UserAccount user)
        {
            _user = user;
            return this;
        }

        public void Matches(List<ParticipantDetailsResponse> participants)
        {
            var participant = participants.First(x => x.Username.Equals(_user.Username));
            participant.Case_type_group.Should().Be(_user.CaseRoleName);
            participant.Display_name.Should().Be(_user.Displayname);
            participant.Name.Should().Be($"Mrs {_user.Firstname} {_user.Lastname}");
            participant.User_role.Should().Be(_user.Role);
            participant.Username.Should().Be(_user.Username);
        }
    }
}
