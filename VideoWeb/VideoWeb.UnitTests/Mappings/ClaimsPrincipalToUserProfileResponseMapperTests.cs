using System;
using System.Security.Claims;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings;

public class ClaimsPrincipalToUserProfileResponseMapperTests
{
    [TestCase(AppRoles.VhOfficerRole, Role.VideoHearingsOfficer)]
    [TestCase(AppRoles.RepresentativeRole, Role.Representative)]
    [TestCase(AppRoles.CitizenRole, Role.Individual)]
    [TestCase(AppRoles.JudgeRole, Role.Judge)]
    [TestCase(AppRoles.CaseAdminRole, Role.CaseAdmin)]
    [TestCase(AppRoles.JudicialOfficeHolderRole, Role.JudicialOfficeHolder)]
    [TestCase(AppRoles.QuickLinkObserver, Role.QuickLinkObserver)]
    [TestCase(AppRoles.QuickLinkParticipant, Role.QuickLinkParticipant)]
    [TestCase(AppRoles.StaffMember, Role.StaffMember)]
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
        
        
        var response = ClaimsPrincipalToUserProfileResponseMapper.Map(user);
        response.Roles.Should().Contain(expectedRole);
        response.FirstName.Should().Be(firstName);
        response.LastName.Should().Be(lastname);
        response.DisplayName.Should().Be(displayName);
        response.Username.Should().Be(username);
        response.Name.Should().Be($"{firstName} {lastname}");
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
        Action action = () => ClaimsPrincipalToUserProfileResponseMapper.Map(user);
        
        action.Should().Throw<NotSupportedException>().WithMessage("No supported role for this application");
    }
    
    [Test]
    public void Should_add_multiple_roles()
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
            .WithRole(AppRoles.VhOfficerRole, AppRoles.StaffMember).Build();
        var response = ClaimsPrincipalToUserProfileResponseMapper.Map(user);
        response.Roles.Should().Contain(Role.VideoHearingsOfficer);
        response.Roles.Should().Contain(Role.StaffMember);
    }
    
    [Test]
    public void Should_map_ejud_claims()
    {
        const string displayName = "John Doe";
        var username = ClaimsPrincipalBuilder.Username;
        var user = new EjudClaimsPrincipalBuilder()
            .WithClaim("name", displayName)
            .WithUsername(username)
            .WithRole(AppRoles.JudgeRole).Build();
        var response = ClaimsPrincipalToUserProfileResponseMapper.Map(user);
        response.Roles.Should().Contain(Role.Judge);
    }
}
