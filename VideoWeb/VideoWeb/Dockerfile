#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.
FROM mcr.microsoft.com/dotnet/core/aspnet:3.1-buster-slim AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM node:10.15-alpine AS client 
ARG skip_client_build=false 
WORKDIR /app 
COPY VideoWeb/ClientApp . 
RUN [[ ${skip_client_build} = true ]] && echo "Skipping npm install" || npm install
RUN [[ ${skip_client_build} = true ]] && mkdir dist || npm run-script build-prod

FROM mcr.microsoft.com/dotnet/core/sdk:3.1-buster AS build
WORKDIR /src
COPY ["VideoWeb/VideoWeb.csproj", "VideoWeb/"]
COPY ["VideoWeb.Common/VideoWeb.Common.csproj", "VideoWeb.Common/"]
COPY ["VideoWeb.Contract/VideoWeb.Contract.csproj", "VideoWeb.Contract/"]
COPY ["VideoWeb.EventHub/VideoWeb.EventHub.csproj", "VideoWeb.EventHub/"]
COPY ["VideoWeb.Services/VideoWeb.Services.csproj", "VideoWeb.Services/"]
RUN dotnet restore "VideoWeb/VideoWeb.csproj"
COPY . .
WORKDIR "/src/VideoWeb"
RUN dotnet build "VideoWeb.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "VideoWeb.csproj" -c Release -o /app/publish -p:PublishRunWebpack=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=client /app/dist /app/ClientApp/dist
ENTRYPOINT ["dotnet", "VideoWeb.dll"]
