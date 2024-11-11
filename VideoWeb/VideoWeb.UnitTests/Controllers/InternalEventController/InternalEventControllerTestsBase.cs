using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public abstract class InternalEventControllerTestsBase<T> where T : ControllerBase
    {
        protected AutoMock Mocker;
        protected T Controller;

        [SetUp]
        public virtual void SetUp()
        {
            Mocker = AutoMock.GetLoose();
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole("Judge").Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            Controller = Mocker.Create<T>();
            Controller.ControllerContext = context;
        }
    }
}
