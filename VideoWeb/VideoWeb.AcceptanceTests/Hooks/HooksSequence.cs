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
        RemoveDataHooks = 7,
        SignOutHooks = 8,
        LogResultHooks = 9,
        TearDownBrowserHooks = 10,
        StopEdgeChromiumServer = 11
    }
}
