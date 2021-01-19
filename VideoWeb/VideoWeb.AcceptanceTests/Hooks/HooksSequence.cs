namespace VideoWeb.AcceptanceTests.Hooks
{
    internal enum HooksSequence
    {
        CleanUpDriverInstances,
        ConfigHooks,
        RegisterApisHooks,
        HealthcheckHooks,
        InitialiseBrowserHooks,
        ConfigureDriverHooks,
        ScenarioHooks,
        SetTimeZone,
        SignOutHooks,
        LogResultHooks,
        TearDownBrowserHooks,
        RemoveAudioFiles,
        RemoveDataHooks
    }
}
