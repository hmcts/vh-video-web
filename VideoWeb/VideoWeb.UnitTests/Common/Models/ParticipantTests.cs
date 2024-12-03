using System;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Consts;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Common.Models;

public class ParticipantTests
{
    [Test]
    public void IsObserver_IsTrue_When_QL_Observer()
    {
        var qlObserver = Builder<Participant>.CreateNew().With(x => x.Role = Role.QuickLinkObserver)
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString()).Build();

        qlObserver.IsObserver().Should().BeTrue();
    }
    
    [Test]
    public void IsObserver_IsTrue_When_Booked_Observer()
    {
        var observer = Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
            .With(x=> x.HearingRole = HearingRoleName.Observer)
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString()).Build();

        observer.IsObserver().Should().BeTrue();
    }

    [Test]
    public void IsObserver_IsFalse_When_Not_An_Observer()
    {
        var qlObserver = Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
            .With(x=> x.HearingRole = HearingRoleName.Solicitor)
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString()).Build();

        qlObserver.IsObserver().Should().BeFalse();
    }
}
