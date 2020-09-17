using System;
using System.Security.Claims;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.User;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings
{
    public class UserProfileResponseMapperTests
    {
        [TestCase("VhOfficer", Role.VideoHearingsOfficer)]
        [TestCase("Representative", Role.Representative)]
        [TestCase("Individual", Role.Individual)]
        [TestCase("Judge", Role.Judge)]
        [TestCase("CaseAdmin", Role.CaseAdmin)]
        public void Should_map_to_user_role(string role, Role expectedRole)
        {
            var profile = new UserProfile
            {
                User_role = role,
                First_name = "Court 11",
                Last_name = "Taylor House",
                User_name = "Court 11, Taylor House"
            };
            var response = UserProfileResponseMapper.MapToResponseModel(profile);

            response.Role.Should().Be(expectedRole);
            response.FirstName.Should().Be(profile.First_name);
            response.LastName.Should().Be(profile.Last_name);
            response.DisplayName.Should().Be(profile.Display_name);
            response.Username.Should().Be(profile.User_name);
        }
        
        [Test]
        public void Should_throw_exception_when_role_is_unsupported()
        {
            Action action = () => UserProfileResponseMapper.MapToResponseModel(new UserProfile
            {
                User_role = "Random"
            });

            action.Should().Throw<NotSupportedException>().WithMessage("Role Random is not supported for this application");
        }

        [TestCase(AppRoles.VhOfficerRole, Role.VideoHearingsOfficer)]
        [TestCase(AppRoles.RepresentativeRole, Role.Representative)]
        [TestCase(AppRoles.CitizenRole, Role.Individual)]
        [TestCase(AppRoles.JudgeRole, Role.Judge)]
        [TestCase(AppRoles.CaseAdminRole, Role.CaseAdmin)]
        public void should_map_claim_to_profile(string role, Role expectedRole)
        {
            const string firstName = "John";
            const string lastname = "Doe";
            var username = ClaimsPrincipalBuilder.Username;
            var user = new ClaimsPrincipalBuilder()
                .WithClaim(ClaimTypes.GivenName, firstName)
                .WithClaim(ClaimTypes.Surname, lastname)
                .WithUsername(username)
                .WithRole(role).Build();

            
            var response = UserProfileResponseMapper.MapUserToResponseModel(user);
            response.Role.Should().Be(expectedRole);
            response.FirstName.Should().Be(firstName);
            response.LastName.Should().Be(lastname);
            response.DisplayName.Should().Be(username);
            response.Username.Should().Be(username);
        }
        
        [Test]
        public void Should_throw_exception_when_claim_role_is_unsupported()
        {
            const string firstName = "John";
            const string lastname = "Doe";
            var username = ClaimsPrincipalBuilder.Username;
            var user = new ClaimsPrincipalBuilder()
                .WithClaim(ClaimTypes.GivenName, firstName)
                .WithClaim(ClaimTypes.Surname, lastname)
                .WithUsername(username)
                .WithRole("unknown").Build();
            Action action = () => UserProfileResponseMapper.MapUserToResponseModel(user);

            action.Should().Throw<NotSupportedException>();
        }
    }
}
