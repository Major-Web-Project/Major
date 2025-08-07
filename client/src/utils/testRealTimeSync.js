// Test utility to verify real-time sync functionality
import { apiService } from '../services/api';

export const testRealTimeSync = async () => {
    console.log('🧪 Testing Real-Time Sync Functionality...');

    try {
        // Test 1: Create a test task
        console.log('📝 Test 1: Creating a test task...');
        const testTaskData = {
            data: {
                name: 'Test Real-Time Sync Task',
                status: 'pending',
                priority: 'medium',
                notes: 'This is a test task for real-time sync',
                estimatedTime: '30 minutes',
                type: 'assignment'
            }
        };

        const createResponse = await apiService.createTask(testTaskData);
        console.log('✅ Task created:', createResponse);

        // Test 2: Fetch tasks to verify creation
        console.log('📋 Test 2: Fetching all tasks...');
        const allTasksResponse = await apiService.getTasks();
        console.log('✅ All tasks fetched:', allTasksResponse.data.tasks.length, 'tasks');

        // Test 3: Fetch tasks by date
        console.log('📅 Test 3: Fetching tasks by date...');
        const today = new Date().toISOString().slice(0, 10);
        const dateTasksResponse = await apiService.getTasksByDate(today);
        console.log('✅ Tasks for today:', dateTasksResponse.data.tasks.length, 'tasks');

        // Test 4: Update the test task
        if (createResponse.data && createResponse.data._id) {
            console.log('✏️ Test 4: Updating the test task...');
            const updateData = {
                name: 'Updated Test Task',
                status: 'completed',
                priority: 'high',
                notes: 'Updated notes for real-time sync test',
                estimatedTime: '45 minutes',
                type: 'assignment'
            };

            const updateResponse = await apiService.updateTask(createResponse.data._id, updateData);
            console.log('✅ Task updated:', updateResponse);
        }

        // Test 5: Test calendar stats
        console.log('📊 Test 5: Testing calendar stats...');
        const currentDate = new Date();
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        const calendarStatsResponse = await apiService.getCalendarDailyStats(month, year);
        console.log('✅ Calendar stats:', calendarStatsResponse.success ? 'Success' : 'Failed');

        console.log('🎉 All tests completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
};

// Function to simulate real-time updates
export const simulateRealTimeUpdates = () => {
    console.log('🔄 Simulating real-time updates...');

    // Dispatch a custom event to trigger real-time sync
    window.dispatchEvent(new CustomEvent('tasksUpdated', {
        detail: {
            allTasks: [],
            dateTasks: [],
            selectedDate: new Date()
        }
    }));

    console.log('✅ Real-time update event dispatched');
};

// Function to monitor real-time events
export const monitorRealTimeEvents = () => {
    console.log('👂 Monitoring real-time events...');

    const handleTasksUpdated = (event) => {
        console.log('🔔 Real-time update received:', {
            allTasksCount: event.detail.allTasks.length,
            dateTasksCount: event.detail.dateTasks.length,
            selectedDate: event.detail.selectedDate
        });
    };

    window.addEventListener('tasksUpdated', handleTasksUpdated);

    // Return cleanup function
    return () => {
        window.removeEventListener('tasksUpdated', handleTasksUpdated);
        console.log('🛑 Stopped monitoring real-time events');
    };
};