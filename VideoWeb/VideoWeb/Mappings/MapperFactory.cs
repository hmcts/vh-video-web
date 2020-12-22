using Microsoft.Extensions.Logging;
using System;

namespace VideoWeb.Mappings
{
    public interface IMapperFactory
    {
        IMapTo<TIn1, TIn2, TIn3, TIn4, TIn5, TOut> Get<TIn1, TIn2, TIn3, TIn4, TIn5, TOut>();
        IMapTo<TIn1, TIn2, TIn3, TIn4, TOut> Get<TIn1, TIn2, TIn3, TIn4, TOut>();
        IMapTo<TIn1, TIn2, TIn3, TOut> Get<TIn1, TIn2, TIn3, TOut>();
        IMapTo<TIn1, TIn2, TOut> Get<TIn1, TIn2, TOut>();
        IMapTo<TIn1, TOut> Get<TIn1, TOut>();
    }

    public class MapperFactory : IMapperFactory
    {
        private readonly IServiceProvider _serviceProvider;

        private readonly ILogger<MapperFactory> _logger;

        public MapperFactory(IServiceProvider serviceProvider, ILogger<MapperFactory> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public IMapTo<TIn1, TOut> Get<TIn1, TOut>() => (IMapTo<TIn1, TOut>)GetMapper(typeof(IMapTo<TIn1, TOut>));
        public IMapTo<TIn1, TIn2, TOut> Get<TIn1, TIn2, TOut>() => (IMapTo<TIn1, TIn2, TOut>)GetMapper(typeof(IMapTo<TIn1, TIn2, TOut>));
        public IMapTo<TIn1, TIn2, TIn3, TOut> Get<TIn1, TIn2, TIn3, TOut>() => (IMapTo<TIn1, TIn2, TIn3, TOut>)GetMapper(typeof(IMapTo<TIn1, TIn2, TIn3, TOut>));
        public IMapTo<TIn1, TIn2, TIn3, TIn4, TOut> Get<TIn1, TIn2, TIn3, TIn4, TOut>() => (IMapTo<TIn1, TIn2, TIn3, TIn4, TOut>)GetMapper(typeof(IMapTo<TIn1, TIn2, TIn3, TIn4, TOut>));
        public IMapTo<TIn1, TIn2, TIn3, TIn4, TIn5, TOut> Get<TIn1, TIn2, TIn3, TIn4, TIn5, TOut>() => (IMapTo<TIn1, TIn2, TIn3, TIn4, TIn5, TOut>)GetMapper(typeof(IMapTo<TIn1, TIn2, TIn3, TIn4, TIn5, TOut>));

        private object GetMapper(Type mapperType)
        {
            // Service Locator is anti-pattern. Stuck between a rock and a hard place, this is the lesser of two evils.
            var mapper = _serviceProvider.GetService(mapperType);
            if (mapper == null)
            {
                var ex = new NotImplementedException($"Unable to resolve mapper for type {mapperType.Name}.");
                _logger.LogError(ex, "Unable to resolve mapper");
                throw ex;
            }

            return mapper;
        }
    }
}
