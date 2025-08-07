// Test utility to verify local date functionality
import {
    getCurrentLocalDate,
    utcToLocalDateString,
    isFutureDate,
    isToday,
    debugDate
} from './dateUtils';

export const testLocalDateFunctionality = () => {
    console.log('🧪 Testing Local Date Functionality...');

    const now = new Date();
    const today = getCurrentLocalDate();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log('📅 Current Local Date:', today);
    console.log('📅 Today from Date object:', utcToLocalDateString(now));
    console.log('📅 Tomorrow:', utcToLocalDateString(tomorrow));
    console.log('📅 Yesterday:', utcToLocalDateString(yesterday));

    console.log('🔍 Date Checks:');
    console.log('- Is today today?', isToday(now));
    console.log('- Is tomorrow future?', isFutureDate(tomorrow));
    console.log('- Is yesterday future?', isFutureDate(yesterday));

    debugDate('Current Date', now);
    debugDate('Tomorrow', tomorrow);
    debugDate('Yesterday', yesterday);

    // Test with different time zones
    const utcDate = new Date('2025-07-26T00:00:00.000Z');
    const localDate = new Date('2025-07-26T12:00:00.000');

    console.log('🌍 Timezone Tests:');
    console.log('- UTC Date 2025-07-26T00:00:00.000Z as local:', utcToLocalDateString(utcDate));
    console.log('- Local Date 2025-07-26T12:00:00.000 as local:', utcToLocalDateString(localDate));

    return {
        currentLocalDate: today,
        todayCheck: isToday(now),
        tomorrowIsFuture: isFutureDate(tomorrow),
        yesterdayIsFuture: isFutureDate(yesterday)
    };
};

// Function to simulate task filtering
export const testTaskFiltering = () => {
    console.log('🧪 Testing Task Filtering...');

    const mockTasks = [
        {
            id: '1',
            name: 'Task from yesterday',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed'
        },
        {
            id: '2',
            name: 'Task from today',
            createdAt: new Date().toISOString(),
            status: 'pending'
        },
        {
            id: '3',
            name: 'Task from tomorrow (should not exist)',
            createdAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending'
        }
    ];

    const today = getCurrentLocalDate();
    const yesterday = utcToLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const tomorrow = utcToLocalDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));

    console.log('📋 Mock Tasks:', mockTasks.map(t => ({
        name: t.name,
        createdAt: t.createdAt,
        localDate: utcToLocalDateString(t.createdAt)
    })));

    const todayTasks = mockTasks.filter(task => {
        const taskLocalDate = utcToLocalDateString(task.createdAt);
        return taskLocalDate === today;
    });

    const yesterdayTasks = mockTasks.filter(task => {
        const taskLocalDate = utcToLocalDateString(task.createdAt);
        return taskLocalDate === yesterday;
    });

    const tomorrowTasks = mockTasks.filter(task => {
        const taskLocalDate = utcToLocalDateString(task.createdAt);
        return taskLocalDate === tomorrow;
    });

    console.log('✅ Filtering Results:');
    console.log(`- Today (${today}):`, todayTasks.length, 'tasks');
    console.log(`- Yesterday (${yesterday}):`, yesterdayTasks.length, 'tasks');
    console.log(`- Tomorrow (${tomorrow}):`, tomorrowTasks.length, 'tasks');

    return {
        todayTasks: todayTasks.length,
        yesterdayTasks: yesterdayTasks.length,
        tomorrowTasks: tomorrowTasks.length
    };
};