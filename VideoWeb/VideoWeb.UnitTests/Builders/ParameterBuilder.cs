using Autofac;
using Autofac.Core;
using Autofac.Extras.Moq;
using System.Collections.Generic;
using System.Linq;

namespace VideoWeb.UnitTests.Builders
{
    public class ParameterBuilder
    {
        private readonly AutoMock _mocker;
        private readonly List<Parameter> _parameters;

        public ParameterBuilder(AutoMock mocker)
        {
            _parameters = new List<Parameter>();
            _mocker = mocker;
        }

        public ParameterBuilder AddTypedParameters<T>()
        {
            var concrete = _mocker.Create<T>(_parameters.ToArray());
            _parameters.AddRange(typeof(T).GetInterfaces().Select(i => new TypedParameter(i, concrete)));
            return this;
        }

        public ParameterBuilder AddObject<T>(T concrete, bool addImplementedInterfaces = true)
        {
            _parameters.Add(new TypedParameter(typeof(T), concrete));
            if (addImplementedInterfaces)
            {
                _parameters.AddRange(typeof(T).GetInterfaces().Select(i => new TypedParameter(i, concrete)));
            }

            return this;
        }

        public Parameter[] Build() => _parameters.ToArray();
    }
}
