using System;
using LaunchDarkly.Logging;
using LaunchDarkly.Sdk;
using LaunchDarkly.Sdk.Server;
using LaunchDarkly.Sdk.Server.Interfaces;

namespace VideoWeb.Common;

public interface IFeatureToggles
{
    public bool Vodafone();
    bool AppInsightsProfilingEnabled();
}

public class FeatureToggles : IFeatureToggles
{
    private readonly ILdClient _ldClient;
    private readonly Context _context;
    private const string LdUser = "vh-video-web";
    private const string VodafoneToggleKey = "vodafone";
    private const string ProfilingKey = "enable-profiling";

    public FeatureToggles(string sdkKey, string environmentName)
    {
        var config = LaunchDarkly.Sdk.Server.Configuration.Builder(sdkKey)
            .Logging(Components.Logging(Logs.ToWriter(Console.Out)).Level(LogLevel.Warn)).Build();
        _context = Context.Builder(LdUser).Name(environmentName).Build();
        _ldClient = new LdClient(config);
    }

    public bool Vodafone()
    {
        return GetBoolValueWithKey(VodafoneToggleKey);
    }

	public bool AppInsightsProfilingEnabled()
    {
        return GetBoolValueWithKey(ProfilingKey);
    }
    
    private bool GetBoolValueWithKey(string key)
    {
        if (!_ldClient.Initialized)
        {
            throw new InvalidOperationException("LaunchDarkly client not initialized");
        }

        return _ldClient.BoolVariation(key, _context);
    }
}

