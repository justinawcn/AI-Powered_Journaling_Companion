'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Download, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  Database,
  Lock,
  Unlock,
  Settings as SettingsIcon
} from 'lucide-react';
import { storageService, StorageSettings, StorageStats } from '@/lib/storageService';
import { useViewportHeight } from '@/lib/useViewportHeight';

export default function SettingsPage() {
  const [settings, setSettings] = useState<StorageSettings>({
    encryptionEnabled: false,
    autoSave: true,
    backupEnabled: false,
    theme: 'auto',
    notifications: true,
  });
  const [stats, setStats] = useState<StorageStats>({
    totalEntries: 0,
    totalSessions: 0,
    storageUsed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ removedEntries: number; updatedSessions: number } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Fix viewport height for mobile devices
  useViewportHeight();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        await storageService.initialize();
        const [loadedSettings, loadedStats] = await Promise.all([
          storageService.getAllSettings(),
          storageService.getStorageStats(),
        ]);
        setSettings(loadedSettings);
        setStats(loadedStats);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = async (key: keyof StorageSettings, value: unknown) => {
    try {
      await storageService.saveSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaningUp(true);
    setCleanupResult(null);
    
    try {
      const result = await storageService.cleanupDuplicateEntries();
      setCleanupResult(result);
      
      // Refresh stats after cleanup
      const newStats = await storageService.getStorageStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to cleanup duplicates:', error);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleEnableEncryption = async () => {
    if (!password || password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    setIsEncrypting(true);
    try {
      await storageService.enableEncryption(password);
      setSettings(prev => ({ ...prev, encryptionEnabled: true }));
      setPassword('');
      setConfirmPassword('');
      alert('Encryption enabled successfully!');
    } catch (error) {
      console.error('Failed to enable encryption:', error);
      alert('Failed to enable encryption. Please try again.');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDisableEncryption = async () => {
    if (!password) {
      alert('Please enter your password to disable encryption');
      return;
    }

    setIsEncrypting(true);
    try {
      await storageService.disableEncryption(password);
      setSettings(prev => ({ ...prev, encryptionEnabled: false }));
      setPassword('');
      setConfirmPassword('');
      alert('Encryption disabled successfully!');
    } catch (error) {
      console.error('Failed to disable encryption:', error);
      alert('Failed to disable encryption. Please check your password.');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await storageService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibe-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await storageService.importData(data);
      alert('Data imported successfully!');
      // Reload settings and stats
      const [loadedSettings, loadedStats] = await Promise.all([
        storageService.getAllSettings(),
        storageService.getStorageStats(),
      ]);
      setSettings(loadedSettings);
      setStats(loadedStats);
    } catch (error) {
      console.error('Failed to import data:', error);
      alert('Failed to import data. Please check the file format.');
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      return;
    }

    try {
      await storageService.clearAllData();
      setStats({
        totalEntries: 0,
        totalSessions: 0,
        storageUsed: 0,
      });
      alert('All data cleared successfully!');
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Please try again.');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="h-screen mobile-viewport-fix tablet-viewport-fix desktop-viewport-fix flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <SettingsIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen mobile-viewport-fix tablet-viewport-fix desktop-viewport-fix bg-gray-50">
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your journal preferences and data</p>
        </div>

        <div className="p-4 space-y-6">
          {/* Storage Statistics */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Database className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-medium text-gray-900">Storage Statistics</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalEntries}</div>
                <div className="text-sm text-gray-500">Journal Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalSessions}</div>
                <div className="text-sm text-gray-500">Chat Sessions</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-500">Storage Used</div>
              <div className="text-lg font-medium text-gray-900">{formatBytes(stats.storageUsed)}</div>
            </div>
          </div>

          {/* Data Cleanup */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Trash2 className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-medium text-gray-900">Data Cleanup</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-gray-900 mb-2">Remove Duplicate Entries</div>
                <div className="text-sm text-gray-500 mb-4">
                  Clean up duplicate journal entries that may have been saved multiple times. This will help reduce storage usage.
                </div>
                <Button
                  onClick={handleCleanupDuplicates}
                  disabled={isCleaningUp}
                  variant="outline"
                  className="w-full"
                >
                  {isCleaningUp ? (
                    <>
                      <SettingsIcon className="w-4 h-4 mr-2 animate-spin" />
                      Cleaning up...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clean Up Duplicates
                    </>
                  )}
                </Button>
                {cleanupResult && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="text-sm text-green-800">
                      <div className="font-medium">Cleanup completed successfully!</div>
                      <div className="mt-1">
                        • Removed {cleanupResult.removedEntries} duplicate entries
                      </div>
                      <div>
                        • Updated {cleanupResult.updatedSessions} sessions
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Encryption Settings */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-medium text-gray-900">Encryption</h2>
              <Badge variant={settings.encryptionEnabled ? "default" : "secondary"}>
                {settings.encryptionEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            {!settings.encryptionEnabled ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (min 8 characters)"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                  />
                </div>
                <Button
                  onClick={handleEnableEncryption}
                  disabled={isEncrypting || !password || !confirmPassword}
                  className="w-full"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isEncrypting ? "Enabling..." : "Enable Encryption"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <Button
                  onClick={handleDisableEncryption}
                  disabled={isEncrypting || !password}
                  variant="outline"
                  className="w-full"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  {isEncrypting ? "Disabling..." : "Disable Encryption"}
                </Button>
              </div>
            )}
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Data Management</h2>
            <div className="space-y-3">
              <Button onClick={handleExportData} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  id="import-file"
                />
                <Button
                  onClick={() => document.getElementById('import-file')?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
              <Button
                onClick={handleClearAllData}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </div>

          {/* App Settings */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">App Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Auto Save</div>
                  <div className="text-sm text-gray-500">Automatically save journal entries</div>
                </div>
                <Button
                  variant={settings.autoSave ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSettingChange('autoSave', !settings.autoSave)}
                >
                  {settings.autoSave ? "On" : "Off"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Notifications</div>
                  <div className="text-sm text-gray-500">Show app notifications</div>
                </div>
                <Button
                  variant={settings.notifications ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSettingChange('notifications', !settings.notifications)}
                >
                  {settings.notifications ? "On" : "Off"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
