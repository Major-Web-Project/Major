import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import { utcToLocalDateString } from '../utils/dateUtils';

const TasksContext = createContext();

export function TasksProvider({ children }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Normalize task object to ensure consistent structure
    const normalizeTask = useCallback((task) => {
        const taskData = task.data || {};
        return {
            id: task._id || task.id,
            name: taskData.name || task.name || "Untitled Task",
            status: taskData.status || task.status || "pending",
            priority: taskData.priority || task.priority || "medium",
            notes: taskData.notes || task.notes,
            estimatedTime: taskData.estimatedTime || task.estimatedTime,
            completionTime: taskData.completionTime || task.completionTime,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            submissionType: taskData.submissionType || task.submissionType,
            submissionFile: taskData.submissionFile || task.submissionFile,
            actualTime: taskData.actualTime || task.actualTime,
            submittedAt: taskData.submittedAt || task.submittedAt,
            category: taskData.category || task.category || taskData.type || 'General',
            isAIGenerated: taskData.isAIGenerated || task.isAIGenerated || false,
            databaseId: task.databaseId || task.id || task._id,
            // Keep original data for backward compatibility
            data: taskData
        };
    }, []);

    // Refresh all tasks from server
    const refreshTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.getTasks();
            const rawTasks = response.data?.tasks || [];

            // Normalize all tasks
            const normalizedTasks = rawTasks.map(normalizeTask);
            setTasks(normalizedTasks);

            console.log('[TasksContext] Refreshed tasks:', normalizedTasks.length);
            return normalizedTasks;
        } catch (err) {
            console.error('Failed to refresh tasks:', err);
            setError('Failed to refresh tasks');
            setTasks([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, [normalizeTask]);

    // Get tasks for a specific date
    const getTasksByDate = useCallback(async (date) => {
        try {
            const dateString = utcToLocalDateString(date);
            const response = await apiService.getTasksByDate(dateString);
            const rawTasks = response.data?.tasks || [];

            // Normalize date-specific tasks
            const normalizedTasks = rawTasks.map(normalizeTask);
            console.log(`[TasksContext] Tasks for ${dateString}:`, normalizedTasks.length);
            return normalizedTasks;
        } catch (err) {
            console.error('Failed to get tasks by date:', err);
            return [];
        }
    }, [normalizeTask]);

    // Submit task - unified function used everywhere
    const submitTask = useCallback(async ({ taskId, submissionType, file, timeSpent }) => {
        try {
            setLoading(true);
            setError(null);

            console.log('[TasksContext] Starting task submission:', { 
                taskId, 
                submissionType, 
                fileName: file?.name,
                fileSize: file?.size,
                fileType: file?.type,
                timeSpent 
            });

            // Validate inputs
            if (!taskId) {
                throw new Error('Task ID is required');
            }
            if (!submissionType) {
                throw new Error('Submission type is required');
            }
            if (!file) {
                throw new Error('File is required');
            }

            // Step 1: Upload file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('taskId', taskId);
            formData.append('submissionType', submissionType);

            console.log('[TasksContext] FormData created with entries:', Array.from(formData.entries()));

            const uploadResponse = await apiService.uploadTaskSubmission(formData);

            console.log('[TasksContext] Upload response received:', uploadResponse);

            if (!uploadResponse.success || !uploadResponse.data?.filePath) {
                throw new Error(`File upload failed: ${uploadResponse.message || 'No file path returned'}`);
            }

            // Step 2: Update task with submission data
            const submissionData = {
                status: 'completed',
                submissionType,
                submissionFile: uploadResponse.data.filePath,
                actualTime: timeSpent / 3600, // Convert seconds to hours
                completionTime: new Date().toLocaleTimeString(),
                submittedAt: new Date().toISOString()
            };

            console.log('[TasksContext] Updating task with submission data:', submissionData);

            const updateResponse = await apiService.updateTask(taskId, submissionData);
            
            if (!updateResponse.success) {
                throw new Error(`Task update failed: ${updateResponse.message || 'Unknown error'}`);
            }

            // Step 3: Refresh all tasks globally to ensure consistency
            await refreshTasks();

            console.log('[TasksContext] Task submission completed successfully');
            return { success: true };
        } catch (error) {
            console.error('[TasksContext] Task submission failed:', error);
            setError('Failed to submit task');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [refreshTasks]);

    // Create task
    const createTask = useCallback(async (taskData, selectedDate) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.createTask(taskData);

            // Refresh tasks after creation
            await refreshTasks();

            return response;
        } catch (err) {
            console.error('Failed to create task:', err);
            setError('Failed to create task');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [refreshTasks]);

    // Update task
    const updateTask = useCallback(async (taskId, taskData) => {
        try {
            setLoading(true);
            setError(null);

            console.log('[TasksContext] Updating task:', { taskId, taskData });

            const response = await apiService.updateTask(taskId, taskData);

            console.log('[TasksContext] Task update response:', response);

            // Refresh tasks after update
            await refreshTasks();

            return response;
        } catch (err) {
            console.error('[TasksContext] Failed to update task:', {
                taskId,
                taskData,
                error: err.message,
                response: err.response?.data
            });
            setError(`Failed to update task: ${err.message}`);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [refreshTasks]);

    // Delete task
    const deleteTask = useCallback(async (taskId) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.deleteTask(taskId);

            // Refresh tasks after deletion
            await refreshTasks();

            return response;
        } catch (err) {
            console.error('Failed to delete task:', err);
            setError('Failed to delete task');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [refreshTasks]);

    // View task submission
    const viewTaskSubmission = useCallback(async (taskId) => {
        try {
            console.log('[TasksContext] viewTaskSubmission called:', { taskId });
            
            const response = await apiService.viewTaskSubmission(taskId);
            console.log('[TasksContext] viewTaskSubmission response:', response);
            
            if (response.success && response.data?.fileUrl) {
                // Try to open the file URL
                const newWindow = window.open(response.data.fileUrl, '_blank');
                
                // Check if popup was blocked
                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    // Popup was blocked, try alternative approach
                    console.log('[TasksContext] Popup blocked, trying alternative approach');
                    
                    // Create a temporary link and click it
                    const link = document.createElement('a');
                    link.href = response.data.fileUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                
                console.log('[TasksContext] File opened successfully:', {
                    fileUrl: response.data.fileUrl,
                    submissionType: response.data.submissionType,
                    fileSize: response.data.fileSize
                });
            } else {
                console.error('[TasksContext] Invalid response:', response);
                throw new Error(response.message || 'Submission file not found');
            }
        } catch (error) {
            console.error('[TasksContext] Failed to view submission:', {
                taskId,
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            // Provide specific error messages
            let errorMessage = 'Failed to view submission file.';
            if (error.response?.status === 404) {
                errorMessage = 'Submission file not found. It may have been deleted or moved.';
            } else if (error.response?.status === 401) {
                errorMessage = 'You are not authorized to view this file. Please log in again.';
            } else if (error.response?.status >= 500) {
                errorMessage = 'Server error while retrieving the file. Please try again later.';
            } else if (error.message.includes('Network Error')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            throw new Error(errorMessage);
        }
    }, []);

    // Download task submission file
    const downloadTaskSubmission = useCallback(async (taskId, fileName) => {
        try {
            console.log('[TasksContext] downloadTaskSubmission called:', { taskId, fileName });
            
            const response = await apiService.downloadTaskSubmission(taskId);
            
            // Create blob URL and trigger download
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            
            // Create temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || `submission-${taskId}`;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('[TasksContext] File downloaded successfully');
        } catch (error) {
            console.error('[TasksContext] Failed to download submission:', {
                taskId,
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            let errorMessage = 'Failed to download submission file.';
            if (error.response?.status === 404) {
                errorMessage = 'Submission file not found.';
            } else if (error.response?.status === 401) {
                errorMessage = 'You are not authorized to download this file.';
            } else if (error.response?.status >= 500) {
                errorMessage = 'Server error while downloading the file.';
            }
            
            throw new Error(errorMessage);
        }
    }, []);

    // Initialize tasks on mount
    useEffect(() => {
        refreshTasks();
    }, [refreshTasks]);

    const value = {
        tasks,
        loading,
        error,
        refreshTasks,
        getTasksByDate,
        submitTask,
        createTask,
        updateTask,
        deleteTask,
        viewTaskSubmission,
        downloadTaskSubmission
    };

    return (
        <TasksContext.Provider value={value}>
            {children}
        </TasksContext.Provider>
    );
}

export function useTasks() {
    const context = useContext(TasksContext);
    if (!context) {
        throw new Error('useTasks must be used within a TasksProvider');
    }
    return context;
}