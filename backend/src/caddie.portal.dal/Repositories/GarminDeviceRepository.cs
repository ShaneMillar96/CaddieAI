using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

/// <summary>
/// Repository implementation for Garmin device operations
/// </summary>
public class GarminDeviceRepository : IGarminDeviceRepository
{
    private readonly CaddieAIDbContext _context;

    public GarminDeviceRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get Garmin device by ID
    /// </summary>
    public async Task<GarminDevice?> GetByIdAsync(int id)
    {
        return await _context.GarminDevices
            .Include(d => d.User)
            .Include(d => d.SwingAnalyses)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    /// <summary>
    /// Get all Garmin devices for a user
    /// </summary>
    public async Task<IEnumerable<GarminDevice>> GetByUserIdAsync(int userId)
    {
        return await _context.GarminDevices
            .Include(d => d.User)
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.PreferredDevice ?? false)
            .ThenByDescending(d => d.LastConnectedAt ?? d.PairedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Get Garmin device by Bluetooth address for a user
    /// </summary>
    public async Task<GarminDevice?> GetByBluetoothAddressAsync(int userId, string bluetoothAddress)
    {
        return await _context.GarminDevices
            .Include(d => d.User)
            .Include(d => d.SwingAnalyses)
            .FirstOrDefaultAsync(d => d.UserId == userId && d.BluetoothAddress == bluetoothAddress);
    }

    /// <summary>
    /// Get user's preferred Garmin device
    /// </summary>
    public async Task<GarminDevice?> GetPreferredDeviceAsync(int userId)
    {
        return await _context.GarminDevices
            .Include(d => d.User)
            .Include(d => d.SwingAnalyses)
            .FirstOrDefaultAsync(d => d.UserId == userId && d.PreferredDevice == true);
    }

    /// <summary>
    /// Get connected Garmin devices for a user
    /// </summary>
    public async Task<IEnumerable<GarminDevice>> GetConnectedDevicesAsync(int userId)
    {
        return await _context.GarminDevices
            .Include(d => d.User)
            .Where(d => d.UserId == userId && d.ConnectionStatus == "connected")
            .OrderByDescending(d => d.PreferredDevice ?? false)
            .ThenByDescending(d => d.LastConnectedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Get devices by connection status for a user
    /// </summary>
    public async Task<IEnumerable<GarminDevice>> GetByConnectionStatusAsync(int userId, string connectionStatus)
    {
        return await _context.GarminDevices
            .Include(d => d.User)
            .Where(d => d.UserId == userId && d.ConnectionStatus == connectionStatus)
            .OrderByDescending(d => d.PreferredDevice ?? false)
            .ThenByDescending(d => d.LastConnectedAt ?? d.PairedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Create a new Garmin device
    /// </summary>
    public async Task<GarminDevice> CreateAsync(GarminDevice garminDevice)
    {
        garminDevice.CreatedAt = DateTime.UtcNow;
        garminDevice.UpdatedAt = DateTime.UtcNow;
        garminDevice.PairedAt = DateTime.UtcNow;
        
        // Set default connection status if not specified
        if (string.IsNullOrEmpty(garminDevice.ConnectionStatus))
        {
            garminDevice.ConnectionStatus = "disconnected";
        }

        _context.GarminDevices.Add(garminDevice);
        await _context.SaveChangesAsync();
        
        return await GetByIdAsync(garminDevice.Id) ?? garminDevice;
    }

    /// <summary>
    /// Update an existing Garmin device
    /// </summary>
    public async Task<GarminDevice> UpdateAsync(GarminDevice garminDevice)
    {
        garminDevice.UpdatedAt = DateTime.UtcNow;
        
        _context.GarminDevices.Update(garminDevice);
        await _context.SaveChangesAsync();
        
        return await GetByIdAsync(garminDevice.Id) ?? garminDevice;
    }

    /// <summary>
    /// Delete a Garmin device
    /// </summary>
    public async Task<bool> DeleteAsync(int id)
    {
        var garminDevice = await _context.GarminDevices.FindAsync(id);
        if (garminDevice == null)
        {
            return false;
        }

        _context.GarminDevices.Remove(garminDevice);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Check if a Garmin device exists
    /// </summary>
    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.GarminDevices.AnyAsync(d => d.Id == id);
    }

    /// <summary>
    /// Check if a Bluetooth address is already registered for a user
    /// </summary>
    public async Task<bool> IsBluetoothAddressRegisteredAsync(int userId, string bluetoothAddress, int? excludeDeviceId = null)
    {
        var query = _context.GarminDevices
            .Where(d => d.UserId == userId && d.BluetoothAddress == bluetoothAddress);
        
        if (excludeDeviceId.HasValue)
        {
            query = query.Where(d => d.Id != excludeDeviceId.Value);
        }

        return await query.AnyAsync();
    }

    /// <summary>
    /// Update connection status for a device
    /// </summary>
    public async Task<GarminDevice?> UpdateConnectionStatusAsync(int id, string connectionStatus, int? batteryLevel = null, string? firmwareVersion = null)
    {
        var device = await _context.GarminDevices.FindAsync(id);
        if (device == null)
        {
            return null;
        }

        device.ConnectionStatus = connectionStatus;
        device.UpdatedAt = DateTime.UtcNow;

        if (connectionStatus == "connected")
        {
            device.LastConnectedAt = DateTime.UtcNow;
        }

        if (batteryLevel.HasValue)
        {
            device.BatteryLevel = batteryLevel.Value;
        }

        if (!string.IsNullOrEmpty(firmwareVersion))
        {
            device.FirmwareVersion = firmwareVersion;
        }

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    /// <summary>
    /// Set a device as the preferred device for a user
    /// </summary>
    public async Task<bool> SetPreferredDeviceAsync(int userId, int deviceId)
    {
        // First, unset all preferred devices for the user
        var userDevices = await _context.GarminDevices
            .Where(d => d.UserId == userId)
            .ToListAsync();

        foreach (var device in userDevices)
        {
            device.PreferredDevice = device.Id == deviceId;
            device.UpdatedAt = DateTime.UtcNow;
        }

        var rowsAffected = await _context.SaveChangesAsync();
        return rowsAffected > 0;
    }
}