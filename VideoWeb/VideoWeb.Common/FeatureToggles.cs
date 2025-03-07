using System;
using LaunchDarkly.Logging;
using LaunchDarkly.Sdk;
using LaunchDarkly.Sdk.Server;
using LaunchDarkly.Sdk.Server.Interfaces;

namespace VideoWeb.Common;

public interface IFeatureToggles
{
    bool AppInsightsProfilingEnabled();
    bool TransferringOnStartEnabled();
}

public class FeatureToggles : IFeatureToggles
{
    private readonly LdClient _ldClient;
    private readonly Context _context;
    private const string LdUser = "vh-video-web";
    private const string ProfilingKey = "enable-profiling";
    private const string TransferringOnStartKey = "joining-message-on-start";

    public FeatureToggles(string sdkKey, string environmentName)
    {
        var config = LaunchDarkly.Sdk.Server.Configuration.Builder(sdkKey)
            .Logging(Components.Logging(Logs.ToWriter(Console.Out)).Level(LogLevel.Warn)).Build();
        _context = Context.Builder(LdUser).Name(environmentName).Build();
        _ldClient = new LdClient(config);
    }

    public bool AppInsightsProfilingEnabled()
    {
        return GetBoolValueWithKey(ProfilingKey);
    }
    
    public bool TransferringOnStartEnabled()
    {
        return GetBoolValueWithKey(TransferringOnStartKey);
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

