namespace VideoWeb.AcceptanceTests.Hooks
{
    internal enum HooksSequence
    {
        ConfigHooks = 1,
        RegisterApisHooks = 2,
        ScenarioHooks = 3,
        HealthcheckHooks = 4,
        InitialiseBrowserHooks = 5,
        ConfigureDriverHooks = 6,
        SetTimeZone = 7,
        RemoveDataHooks = 8,
        SignOutHooks = 9,
        LogResultHooks = 10,
        TearDownBrowserHooks = 11,
        StopEdgeChromiumServer = 12,
    }
}
