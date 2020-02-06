ARG SDK_VERSION=latest
ARG RUNTIME_VERSION=latest

FROM mcr.microsoft.com/dotnet/core/aspnet:${RUNTIME_VERSION} AS base
RUN apt-get update -yq \
    && apt-get install curl gnupg -yq \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash \
    && apt-get install nodejs -yq
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

FROM mcr.microsoft.com/dotnet/core/sdk:${SDK_VERSION} AS build
RUN apt-get update -yq \
    && apt-get install curl gnupg -yq \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash \
    && apt-get install nodejs -yq
WORKDIR /src
COPY . .
RUN dotnet restore VideoWeb
RUN dotnet build VideoWeb -c Release -o /app/build

FROM build AS publish
RUN dotnet publish VideoWeb -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "VideoWeb.dll"]
