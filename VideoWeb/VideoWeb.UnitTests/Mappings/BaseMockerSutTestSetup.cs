using Autofac.Extras.Moq;
using FluentAssertions;
using NUnit.Framework;

namespace VideoWeb.UnitTests.Mappings
{
    public abstract class BaseMockerSutTestSetup<TSut> where TSut : class
    {
        protected AutoMock _mocker;
        protected TSut _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _sut = _mocker.Create<TSut>();
        }

        [Test]
        public void Sut_should_be_setup()
        {
            _sut.Should().NotBeNull();
        }
    }
}
