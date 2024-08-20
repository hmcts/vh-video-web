# Getting Docker Compose to run locally

## Get your nuget config authentication in

* Either hardcode the auth by including a snippet below:

``` xml
<packageSourceCredentials>
    <vh-packages>
        <add key="Username" value="<your username>" />
        <add key="ClearTextPassword" value="<your pat>" />
    </vh-packages>
</packageSourceCredentials>

```

Your nuget config should look like below (don't forget to put in your correct credentials):

``` xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <!-- defaultPushSource key works like the 'defaultPushSource' key of NuGet.Config files. -->
  <!-- This can be used by administrators to prevent accidental publishing of packages to nuget.org. -->
  <config>
    <add key="defaultPushSource" value="https://pkgs.dev.azure.com/hmcts/cf3711aa-2aed-4f62-81a8-2afaee0ce26d/_packaging/vh-packages/nuget/v3/index.json" />
  </config>

  <!-- Default Package Sources; works like the 'packageSources' section of NuGet.Config files. -->
  <!-- This collection cannot be deleted or modified but can be disabled/enabled by users. -->
  <packageSources>
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <add key="vh-packages" value="https://pkgs.dev.azure.com/hmcts/cf3711aa-2aed-4f62-81a8-2afaee0ce26d/_packaging/vh-packages/nuget/v3/index.json" />
  </packageSources>

  <!-- Default Package Sources that are disabled by default. -->
  <!-- Works like the 'disabledPackageSources' section of NuGet.Config files. -->
  <!-- Sources cannot be modified or deleted either but can be enabled/disabled by users. -->

  <packageSourceCredentials>
    <vh-packages>
      <add key="Username" value="<your username>" />
      <add key="ClearTextPassword" value="<your pat>" />
    </vh-packages>
  </packageSourceCredentials>
</configuration> 
```


## Create a new dev certificate

``` bash
dotnet dev-certs https -ep ${HOME}/.aspnet/https/aspnetapp-vh.pfx -p password
dotnet dev-certs https --trust
```

## Force the use of user secrets

In the program file add the following line before we loop to add the keyvaults in `ConfigureAppConfiguration`:

``` csharp
configBuilder.AddUserSecrets<Startup>();
```
