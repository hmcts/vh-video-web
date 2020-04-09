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
        RemoveDataHooks = 8,
        SignOutHooks = 9,
        LogResultHooks = 10,
        TearDownBrowserHooks = 11,
        StopEdgeChromiumServer = 12,
    }
}
