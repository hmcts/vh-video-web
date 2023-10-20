using System.Collections.Generic;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class UserProfileToUserProfileResponseMapperTests : BaseMockerSutTestSetup<UserProfileToUserProfileResponseMapper>
    {
        [TestCase("VhOfficer", Role.VideoHearingsOfficer)]
        [TestCase("Representative", Role.Representative)]
        [TestCase("Individual", Role.Individual)]
        [TestCase("Judge", Role.Judge)]
        [TestCase("CaseAdmin", Role.CaseAdmin)]
        [TestCase("JudicialOfficeHolder", Role.JudicialOfficeHolder)]
        public void Should_map_to_user_role(string role, Role expectedRole)
        {
            var profile = new UserProfile
            {
                Roles = new List<Role> { expectedRole },
                FirstName = "Court 11",
                LastName = "Taylor House",
                UserName = "Court 11, Taylor House"
            };
            var response = _sut.Map(profile);

            response.Roles.Should().Contain(expectedRole);
            response.FirstName.Should().Be(profile.FirstName);
            response.LastName.Should().Be(profile.LastName);
            response.DisplayName.Should().Be(profile.DisplayName);
            response.Username.Should().Be(profile.UserName);
        }
    }
}
