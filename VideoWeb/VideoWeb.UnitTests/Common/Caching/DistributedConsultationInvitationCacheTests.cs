﻿using System;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Common.Caching;

[TestFixture]
public class DistributedConsultationInvitationCacheTests
{
    private AutoMock _mocker;
    private IDistributedCache _distributedCache;
    private DistributedConsultationInvitationCache _sut;
    private Mock<ILogger<RedisCacheBase<Guid, ConsultationInvitation>>> _loggerMock;
    
    private async Task WriteToCache<T>(Guid key, T obj) where T : class
    {
        var serialisedObj = JsonSerializer.Serialize(obj, CachingHelper.JsonSerializerOptions);
        var data = Encoding.UTF8.GetBytes(serialisedObj);
        await _distributedCache.SetAsync(key.ToString(), data,
            new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromHours(4)
            });
    }
    
    private async Task<T> ReadFromCache<T>(Guid key) where T : class
    {
        var data = await _distributedCache.GetAsync(key.ToString());
        return data == null ? null : JsonSerializer.Deserialize<T>(Encoding.UTF8.GetString(data),
            CachingHelper.JsonSerializerOptions);
    }
    
    [SetUp]
    public void SetUp()
    {
        var opts = Options.Create(new MemoryDistributedCacheOptions());
        _distributedCache = new MemoryDistributedCache(opts);
        _loggerMock = new Mock<ILogger<RedisCacheBase<Guid, ConsultationInvitation>>>();
        _mocker = AutoMock.GetStrict(builder =>
        {
            builder.RegisterInstance(_distributedCache);
            builder.RegisterInstance(_loggerMock.Object);
        });
        _sut = _mocker.Create<DistributedConsultationInvitationCache>();
    }
    
    [Test]
    public async Task Should_create_invitation_entry_for_an_invitation_and_update_participant_to_invitation_map()
    {
        // Arrange
        var participantGuid = Guid.NewGuid();
        var linkedParticipantGuid = Guid.NewGuid();
        var roomLabel = "room_label";
        var invitation = ConsultationInvitation.Create(participantGuid, roomLabel, new[] {linkedParticipantGuid});
        
        // Act
        await _sut.WriteToCache(invitation);
        
        // Assert
        (await ReadFromCache<ConsultationInvitation>(invitation.InvitationId)).Should().BeEquivalentTo(invitation);
    }
    
    [Test]
    public async Task Should_get_invitation_entry_for_an_invitation_that_exists()
    {
        // Arrange
        var participantGuid = Guid.NewGuid();
        var linkedParticipantGuid = Guid.NewGuid();
        var roomLabel = "room_label";
        var storedInvitation = ConsultationInvitation.Create(participantGuid, roomLabel, new[] {linkedParticipantGuid});
        
        await WriteToCache(storedInvitation.InvitationId, storedInvitation);
        
        // Act
        var invitation = await _sut.ReadFromCache(storedInvitation.InvitationId);
        
        // Assert
        invitation.Should().BeEquivalentTo(storedInvitation);
    }
    
    [Test]
    public async Task Should_get_null_for_an_invitation_that_DOES_NOT_exists()
    {
        // Arrange
        var participantGuid = Guid.NewGuid();
        var linkedParticipantGuid = Guid.NewGuid();
        var roomLabel = "room_label";
        var storedInvitation =
            ConsultationInvitation.Create(participantGuid, roomLabel, new[] {linkedParticipantGuid});
        
        // Act
        var invitation = await _sut.ReadFromCache(storedInvitation.InvitationId);
        
        // Assert
        invitation.Should().BeNull();
    }
}
