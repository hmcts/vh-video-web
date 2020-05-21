namespace VideoWeb.AcceptanceTests.Hooks
{
    internal enum HooksSequence
    {
        ConfigHooks = 1,
        RegisterApisHooks = 2,
        HealthcheckHooks = 3,
        InitialiseBrowserHooks = 4,
        ConfigureDriverHooks = 5,
        ScenarioHooks = 6,
        SetTimeZone = 7,
        SignOutHooks = 8,
        LogResultHooks = 9,
        TearDownBrowserHooks = 10,
        StopEdgeChromiumServer = 11,
        RemoveAudioFiles = 12,
        RemoveDataHooks = 13
    }
}
