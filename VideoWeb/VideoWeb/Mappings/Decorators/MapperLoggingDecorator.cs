using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Diagnostics;

namespace VideoWeb.Mappings.Decorators
{
    public class MapperLoggingDecorator<TOut, TIn> : IMapTo<TOut, TIn>
    {
        private readonly IMapTo<TOut, TIn> _underlyingMapper;

        private readonly ILogger<IMapTo<TOut, TIn>> _logger;

        public MapperLoggingDecorator(IMapTo<TOut, TIn> underlyingMapper, ILogger<IMapTo<TOut, TIn>> logger)
        {
            _underlyingMapper = underlyingMapper;
            _logger = logger;
        }

        public TOut Map(TIn input)
        {
            using var _ = _logger.BeginScope(new Dictionary<string, object>
            { 
                ["TIn"] = typeof(TIn).Name,
                ["TOut"] = typeof(TOut).Name
            });

            _logger.LogDebug("Mapping");
            var sw = Stopwatch.StartNew();
            var result = _underlyingMapper.Map(input);
            _logger.LogDebug("Mapped in {ElapsedMilliseconds}ms", sw.ElapsedMilliseconds);

            return result;
        }
    }

    public class MapperLoggingDecorator<TOut, TIn1, TIn2> : IMapTo<TOut, TIn1, TIn2>
    {
        private readonly IMapTo<TOut, TIn1, TIn2> _underlyingMapper;

        private readonly ILogger<IMapTo<TOut, TIn1, TIn2>> _logger;

        public MapperLoggingDecorator(IMapTo<TOut, TIn1, TIn2> underlyingMapper, ILogger<IMapTo<TOut, TIn1, TIn2>> logger)
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

    public class MapperLoggingDecorator<TOut, TIn1, TIn2, TIn3> : IMapTo<TOut, TIn1, TIn2, TIn3>
    {
        private readonly IMapTo<TOut, TIn1, TIn2, TIn3> _underlyingMapper;

        private readonly ILogger<IMapTo<TOut, TIn1, TIn2, TIn3>> _logger;

        public MapperLoggingDecorator(IMapTo<TOut, TIn1, TIn2, TIn3> underlyingMapper, ILogger<IMapTo<TOut, TIn1, TIn2, TIn3>> logger)
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

    public class MapperLoggingDecorator<TOut, TIn1, TIn2, TIn3, TIn4> : IMapTo<TOut, TIn1, TIn2, TIn3, TIn4>
    {
        private readonly IMapTo<TOut, TIn1, TIn2, TIn3, TIn4> _underlyingMapper;

        private readonly ILogger<IMapTo<TOut, TIn1, TIn2, TIn3, TIn4>> _logger;

        public MapperLoggingDecorator(IMapTo<TOut, TIn1, TIn2, TIn3, TIn4> underlyingMapper, ILogger<IMapTo<TOut, TIn1, TIn2, TIn3, TIn4>> logger)
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

    public class MapperLoggingDecorator<TOut, TIn1, TIn2, TIn3, TIn4, TIn5> : IMapTo<TOut, TIn1, TIn2, TIn3, TIn4, TIn5>
    {
        private readonly IMapTo<TOut, TIn1, TIn2, TIn3, TIn4, TIn5> _underlyingMapper;

        private readonly ILogger<IMapTo<TOut, TIn1, TIn2, TIn3, TIn4, TIn5>> _logger;

        public MapperLoggingDecorator(IMapTo<TOut, TIn1, TIn2, TIn3, TIn4, TIn5> underlyingMapper, ILogger<IMapTo<TOut, TIn1, TIn2, TIn3, TIn4, TIn5>> logger)
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
