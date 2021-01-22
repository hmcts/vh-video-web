using System;
using System.Security.Claims;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings
{

    public class ClaimsPrincipalToUserProfileResponseMapperTests : BaseMockerSutTestSetup<ClaimsPrincipalToUserProfileResponseMapper>
    {
        [TestCase(AppRoles.VhOfficerRole, Role.VideoHearingsOfficer)]
        [TestCase(AppRoles.RepresentativeRole, Role.Representative)]
        [TestCase(AppRoles.CitizenRole, Role.Individual)]
        [TestCase(AppRoles.JudgeRole, Role.Judge)]
        [TestCase(AppRoles.CaseAdminRole, Role.CaseAdmin)]
        [TestCase(AppRoles.JudicialOfficeHolderRole, Role.JudicialOfficeHolder)]
        public void should_map_claim_to_profile(string role, Role expectedRole)
        {
            const string firstName = "John";
            const string lastname = "Doe";
            const string displayName = "John Doe";
            var username = ClaimsPrincipalBuilder.Username;
            var user = new ClaimsPrincipalBuilder()
                .WithClaim(ClaimTypes.GivenName, firstName)
                .WithClaim(ClaimTypes.Surname, lastname)
                .WithClaim("name", displayName)
                .WithUsername(username)
                .WithRole(role).Build();


            var response = _sut.Map(user);
            response.Role.Should().Be(expectedRole);
            response.FirstName.Should().Be(firstName);
            response.LastName.Should().Be(lastname);
            response.DisplayName.Should().Be(displayName);
            response.Username.Should().Be(username);
        }

        [Test]
        public void Should_throw_exception_when_claim_role_is_unsupported()
        {
            const string firstName = "John";
            const string lastname = "Doe";
            const string displayName = "John Doe";
            var username = ClaimsPrincipalBuilder.Username;
            var user = new ClaimsPrincipalBuilder()
                .WithClaim(ClaimTypes.GivenName, firstName)
                .WithClaim(ClaimTypes.Surname, lastname)
                .WithClaim("name", displayName)
                .WithUsername(username)
                .WithRole("unknown").Build();
            Action action = () => _sut.Map(user);

            action.Should().Throw<NotSupportedException>().WithMessage("Role is not supported for this application");
        }
    }
}
