using System;
using System.Reflection;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Helpers
{
    public class AppVersion
    {
        private static ApplicationVersion _instance;
        private static readonly object SyncLock = new object();

        protected AppVersion()
        { }

        public static ApplicationVersion Instance()
        {
            if (_instance != null) return _instance;
            lock (SyncLock)
            {
                _instance = new ApplicationVersion
                {
                    FileVersion = GetExecutingAssemblyAttribute<AssemblyFileVersionAttribute>(a => a.Version),
                    InformationVersion =
                        GetExecutingAssemblyAttribute<AssemblyInformationalVersionAttribute>(
                            a => a.InformationalVersion)
                };
            }
            return _instance;
        }
        
        private static string GetExecutingAssemblyAttribute<T>(Func<T, string> value) where T : Attribute
        {
            T attribute = (T)Attribute.GetCustomAttribute(Assembly.GetExecutingAssembly(), typeof(T));
            return value.Invoke(attribute);
        }
    }
}
