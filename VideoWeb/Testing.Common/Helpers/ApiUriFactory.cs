namespace Testing.Common.Helpers
{
    public class ApiUriFactory
    {
        public ApiUriFactory()
        {
            ConfigSettingsEndpoints = new ConfigSettingsEndpoints();
        }

        public ConfigSettingsEndpoints ConfigSettingsEndpoints { get; set; }
    }

    public class ConfigSettingsEndpoints
    {
        private string ApiRoot => "api/config";
        public string GetConfigSettings => ApiRoot;
    }
}