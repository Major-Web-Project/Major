import React, { useState, useEffect } from 'react';
import { migrateLocalStorageToIndexedDB, checkForLegacyFiles, getLocalStorageUsage } from '../utils/migrationUtils';
import { apiService } from '../services/api';

const StorageManager = () => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [legacyFiles, setLegacyFiles] = useState([]);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStorageInfo();
    checkLegacyFiles();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const info = await apiService.getStorageInfo();
      const localStorageInfo = getLocalStorageUsage();
      setStorageInfo({ ...info, localStorage: localStorageInfo });
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const checkLegacyFiles = () => {
    const files = checkForLegacyFiles();
    setLegacyFiles(files);
  };

  const handleMigration = async () => {
    setIsLoading(true);
    setMigrationStatus(null);
    
    try {
      const result = await migrateLocalStorageToIndexedDB();
      setMigrationStatus(result);
      
      // Refresh info after migration
      await loadStorageInfo();
      checkLegacyFiles();
    } catch (error) {
      setMigrationStatus({
        success: false,
        message: error.message || 'Migration failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearOldFiles = async () => {
    setIsLoading(true);
    try {
      const deletedCount = await apiService.clearOldFiles(30);
      alert(`Cleared ${deletedCount} old files`);
      await loadStorageInfo();
    } catch (error) {
      alert('Failed to clear old files: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="storage-manager p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Storage Management</h3>
      
      {/* Storage Information */}
      {storageInfo && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Storage Usage</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <h5 className="font-medium">IndexedDB (Current)</h5>
              {storageInfo.quota ? (
                <>
                  <p>Used: {(storageInfo.usage / (1024 * 1024)).toFixed(2)} MB</p>
                  <p>Available: {(storageInfo.available / (1024 * 1024)).toFixed(2)} MB</p>
                  <p>Usage: {storageInfo.usagePercentage}%</p>
                </>
              ) : (
                <p>Storage info not available</p>
              )}
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h5 className="font-medium">LocalStorage (Legacy)</h5>
              <p>Used: {storageInfo.localStorage.totalSizeMB} MB</p>
              <p>Items: {storageInfo.localStorage.itemCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Files Migration */}
      {legacyFiles.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800 mb-2">
            Migration Required
          </h4>
          <p className="text-yellow-700 mb-3">
            Found {legacyFiles.length} files in localStorage that should be migrated to IndexedDB 
            to prevent quota exceeded errors.
          </p>
          <button
            onClick={handleMigration}
            disabled={isLoading}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {isLoading ? 'Migrating...' : 'Migrate Files'}
          </button>
        </div>
      )}

      {/* Migration Status */}
      {migrationStatus && (
        <div className={`mb-4 p-3 rounded ${
          migrationStatus.success 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="font-medium">{migrationStatus.message}</p>
          {migrationStatus.errors && migrationStatus.errors.length > 0 && (
            <details className="mt-2">
              <summary>View Errors ({migrationStatus.errors.length})</summary>
              <ul className="mt-1 text-sm">
                {migrationStatus.errors.map((error, index) => (
                  <li key={index}>{error.key}: {error.error}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={loadStorageInfo}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Refresh Info
        </button>
        <button
          onClick={clearOldFiles}
          disabled={isLoading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          Clear Old Files (30+ days)
        </button>
      </div>
    </div>
  );
};

export default StorageManager;