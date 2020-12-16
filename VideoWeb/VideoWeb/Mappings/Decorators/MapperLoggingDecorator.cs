using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Diagnostics;

namespace VideoWeb.Mappings.Decorators
{
    public class MapperLoggingDecorator<TIn1, TOut> : IMapTo<TIn1, TOut>
    {
        private readonly IMapTo<TIn1, TOut> _underlyingMapper;

        private readonly ILogger<IMapTo<TIn1, TOut>> _logger;

        public MapperLoggingDecorator(IMapTo<TIn1, TOut> underlyingMapper, ILogger<IMapTo<TIn1, TOut>> logger)
        {
            _underlyingMapper = underlyingMapper;
            _logger = logger;
        }

        public TOut Map(TIn1 input)
        {
            using var _ = _logger.BeginScope(new Dictionary<string, object>
            { 
                ["TIn1"] = typeof(TIn1).Name,
                ["TOut"] = typeof(TOut).Name
            });

            _logger.LogDebug("Mapping");
            var sw = Stopwatch.StartNew();
            var result = _underlyingMapper.Map(input);
            _logger.LogDebug("Mapped in {ElapsedMilliseconds}ms", sw.ElapsedMilliseconds);

            return result;
        }
    }

    public class MapperLoggingDecorator<TIn1, TIn2, TOut> : IMapTo<TIn1, TIn2, TOut>
    {
        private readonly IMapTo<TIn1, TIn2, TOut> _underlyingMapper;

        private readonly ILogger<IMapTo<TIn1, TIn2, TOut>> _logger;

        public MapperLoggingDecorator(IMapTo<TIn1, TIn2, TOut> underlyingMapper, ILogger<IMapTo<TIn1, TIn2, TOut>> logger)
        {
            _underlyingMapper = underlyingMapper;
            _logger = logger;
        }

        public TOut Map(TIn1 input1, TIn2 input2)
        {
            using var _ = _logger.BeginScope(new Dictionary<string, object>
            {
                ["TIn1"] = typeof(TIn1).Name,
                ["TIn2"] = typeof(TIn2).Name,
                ["TOut"] = typeof(TOut).Name
            });

            _logger.LogDebug("Mapping");
            var sw = Stopwatch.StartNew();
            var result = _underlyingMapper.Map(input1, input2);
            _logger.LogDebug("Mapped in {ElapsedMilliseconds}ms", sw.ElapsedMilliseconds);

            return result;
        }
    }

    public class MapperLoggingDecorator<TIn1, TIn2, TIn3, TOut> : IMapTo<TIn1, TIn2, TIn3, TOut>
    {
        private readonly IMapTo<TIn1, TIn2, TIn3, TOut> _underlyingMapper;

        private readonly ILogger<IMapTo<TIn1, TIn2, TIn3, TOut>> _logger;

        public MapperLoggingDecorator(IMapTo<TIn1, TIn2, TIn3, TOut> underlyingMapper, ILogger<IMapTo<TIn1, TIn2, TIn3, TOut>> logger)
        {
            _underlyingMapper = underlyingMapper;
            _logger = logger;
        }

        public TOut Map(TIn1 input1, TIn2 input2, TIn3 input3)
        {
            using var _ = _logger.BeginScope(new Dictionary<string, object>
            {
                ["TIn1"] = typeof(TIn1).Name,
                ["TIn2"] = typeof(TIn2).Name,
                ["TIn3"] = typeof(TIn3).Name,
                ["TOut"] = typeof(TOut).Name
            });

            _logger.LogDebug("Mapping");
            var sw = Stopwatch.StartNew();
            var result = _underlyingMapper.Map(input1, input2, input3);
            _logger.LogDebug("Mapped in {ElapsedMilliseconds}ms", sw.ElapsedMilliseconds);

            return result;
        }
    }

    public class MapperLoggingDecorator<TIn1, TIn2, TIn3, TIn4, TOut> : IMapTo<TIn1, TIn2, TIn3, TIn4, TOut>
    {
        private readonly IMapTo<TIn1, TIn2, TIn3, TIn4, TOut> _underlyingMapper;

        private readonly ILogger<IMapTo<TIn1, TIn2, TIn3, TIn4, TOut>> _logger;

        public MapperLoggingDecorator(IMapTo<TIn1, TIn2, TIn3, TIn4, TOut> underlyingMapper, ILogger<IMapTo<TIn1, TIn2, TIn3, TIn4, TOut>> logger)
        {
            _underlyingMapper = underlyingMapper;
            _logger = logger;
        }

        public TOut Map(TIn1 input1, TIn2 input2, TIn3 input3, TIn4 input4)
        {
            using var _ = _logger.BeginScope(new Dictionary<string, object>
            {
                ["TIn1"] = typeof(TIn1).Name,
                ["TIn2"] = typeof(TIn2).Name,
                ["TIn3"] = typeof(TIn3).Name,
                ["TIn4"] = typeof(TIn3).Name,
                ["TOut"] = typeof(TOut).Name
            });

            _logger.LogDebug("Mapping");
            var sw = Stopwatch.StartNew();
            var result = _underlyingMapper.Map(input1, input2, input3, input4);
            _logger.LogDebug("Mapped in {ElapsedMilliseconds}ms", sw.ElapsedMilliseconds);

            return result;
        }
    }

    public class MapperLoggingDecorator<TIn1, TIn2, TIn3, TIn4, TIn5, TOut> : IMapTo<TIn1, TIn2, TIn3, TIn4, TIn5, TOut>
    {
        private readonly IMapTo<TIn1, TIn2, TIn3, TIn4, TIn5, TOut> _underlyingMapper;

        private readonly ILogger<IMapTo<TIn1, TIn2, TIn3, TIn4, TIn5, TOut>> _logger;

        public MapperLoggingDecorator(IMapTo<TIn1, TIn2, TIn3, TIn4, TIn5, TOut> underlyingMapper, ILogger<IMapTo<TIn1, TIn2, TIn3, TIn4, TIn5, TOut>> logger)
        {
            _underlyingMapper = underlyingMapper;
            _logger = logger;
        }

        public TOut Map(TIn1 input1, TIn2 input2, TIn3 input3, TIn4 input4, TIn5 input5)
        {
            using var _ = _logger.BeginScope(new Dictionary<string, object>
            {
                ["TIn1"] = typeof(TIn1).Name,
                ["TIn2"] = typeof(TIn2).Name,
                ["TIn3"] = typeof(TIn3).Name,
                ["TIn4"] = typeof(TIn4).Name,
                ["TIn5"] = typeof(TIn5).Name,
                ["TOut"] = typeof(TOut).Name
            });

            _logger.LogDebug("Mapping");
            var sw = Stopwatch.StartNew();
            var result = _underlyingMapper.Map(input1, input2, input3, input4, input5);
            _logger.LogDebug("Mapped in {ElapsedMilliseconds}ms", sw.ElapsedMilliseconds);

            return result;
        }
    }
}
