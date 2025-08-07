import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { aiAssistant, completeCurrentGoal, resetCurrentGoal, getGoalProgress } from '../../services/aiLearningService';
import { taskSyncService } from '../../services/taskSyncService';
import { useTasks } from '../../contexts/TasksContext';
import { TaskSubmitButton } from '../tasks/TaskSubmitButton';
import { apiService } from '../../services/api';

export const LearningDashboardScreen = ({
    learningData,
    userProfile,
    roadmap,
    dashboardData,
    aiTasksData,
    onTaskComplete,
    onUpdateProgress
}) => {
    const { createTask, refreshTasks } = useTasks();
    const [currentTasks, setCurrentTasks] = useState(aiTasksData || []);
    const [analytics, setAnalytics] = useState(dashboardData || null);
    const [recommendations, setRecommendations] = useState([]);
    const [taskTimers, setTaskTimers] = useState({});
    const [goalProgress] = useState(getGoalProgress());
    
    // Task submission state
    const [expandedSubmission, setExpandedSubmission] = useState(null);

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Initialize AI assistant with user profile
        if (userProfile) {
            aiAssistant.userProfile = userProfile;
        }

        // Load analytics and recommendations
        const analyticsData = aiAssistant.getLearningAnalytics();
        const recs = aiAssistant.generateImprovementRecommendations(
            userProfile || {},
            analyticsData
        );

        setAnalytics(prev => ({ ...prev, ...analyticsData }));
        setRecommendations(recs);

        // Use provided AI tasks or generate new ones
        let tasksToSet = [];
        if (aiTasksData && aiTasksData.length > 0) {
            tasksToSet = aiTasksData;
        } else if (roadmap && userProfile) {
            tasksToSet = aiAssistant.generateDailyTasks(
                roadmap,
                learningData?.currentPhase || 1,
                learningData?.dayNumber || 1,
                userProfile
            );
        }

        setCurrentTasks(tasksToSet);

        // Sync AI tasks with task service
        if (tasksToSet.length > 0) {
            taskSyncService.syncAITasks(tasksToSet);
        }
    }, [learningData, userProfile, roadmap, dashboardData, aiTasksData]);



    // Listen for task updates from other pages
    useEffect(() => {
        const handleTasksUpdated = async (event) => {
            console.log('Learning Dashboard: Tasks updated from other pages', event.detail);

            // Refresh analytics when tasks are updated
            const newAnalytics = aiAssistant.getLearningAnalytics();
            setAnalytics(prev => ({ ...prev, ...newAnalytics }));

            // If an AI task was completed elsewhere, update local state
            if (event.detail?.taskId && event.detail?.action === 'completed') {
                setCurrentTasks(tasks =>
                    tasks.map(t =>
                        t.databaseId === event.detail.taskId || t.id === event.detail.taskId
                            ? { ...t, status: 'completed' }
                            : t
                    )
                );
            }
        };

        window.addEventListener('tasksUpdated', handleTasksUpdated);

        return () => {
            window.removeEventListener('tasksUpdated', handleTasksUpdated);
        };
    }, []);

    // Update timers every second
    useEffect(() => {
        const interval = setInterval(() => {
            setTaskTimers(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(taskId => {
                    if (updated[taskId].isRunning && updated[taskId].startTime) {
                        const now = Date.now();
                        const elapsed = now - updated[taskId].startTime - (updated[taskId].pausedTime || 0);
                        updated[taskId].elapsedTime = Math.max(0, elapsed);
                    }
                });
                return updated;
            });


        }, 1000);

        return () => clearInterval(interval);
    }, []);







    const handleStartTask = (taskId) => {
        const startTime = Date.now();
        setTaskTimers(prev => ({
            ...prev,
            [taskId]: {
                startTime,
                isRunning: true,
                elapsedTime: 0,
                pausedTime: 0,
                breakCount: 0
            }
        }));

        console.log(`Starting task ${taskId} at ${new Date(startTime).toISOString()}`);
    };

    const handlePauseResumeTask = (taskId) => {
        const timer = taskTimers[taskId];
        if (!timer) return;

        if (timer.isRunning) {
            // Pause timer
            const pauseTime = Date.now();
            setTaskTimers(prev => ({
                ...prev,
                [taskId]: {
                    ...prev[taskId],
                    isRunning: false,
                    lastPauseTime: pauseTime,
                    breakCount: prev[taskId].breakCount + 1
                }
            }));
        } else {
            // Resume timer
            const resumeTime = Date.now();
            const additionalPausedTime = timer.lastPauseTime ? resumeTime - timer.lastPauseTime : 0;

            setTaskTimers(prev => ({
                ...prev,
                [taskId]: {
                    ...prev[taskId],
                    isRunning: true,
                    pausedTime: (prev[taskId].pausedTime || 0) + additionalPausedTime,
                    lastPauseTime: null
                }
            }));
        }
    };

    // Handle AI task submission with database creation if needed
    const handleAITaskSubmission = async (task, submissionData) => {
        try {
            let databaseTaskId = task.databaseId;

            // If this is an AI task without database ID, create it first
            if (!databaseTaskId) {
                const taskData = {
                    name: task.title,
                    status: 'pending',
                    priority: task.priority || 'medium',
                    notes: task.description || '',
                    estimatedTime: task.estimatedTime,
                    category: task.category || 'AI Generated',
                    isAIGenerated: true
                };

                console.log('Creating AI task in database...', taskData);
                const createTaskResponse = await createTask({ data: taskData });
                databaseTaskId = createTaskResponse.data.id || createTaskResponse.data._id;
                console.log('AI task created with ID:', databaseTaskId);

                // Store database ID in local task
                setCurrentTasks(tasks =>
                    tasks.map(t =>
                        t.id === task.id ? { ...t, databaseId: databaseTaskId } : t
                    )
                );
            }

            // Update local state immediately for better UX
            setCurrentTasks(tasks =>
                tasks.map(t =>
                    t.id === task.id ? {
                        ...t,
                        status: 'completed',
                        submissionType: submissionData.submissionType,
                        submissionFile: submissionData.submissionFile,
                        actualTime: submissionData.actualTime,
                        completionTime: submissionData.completionTime,
                        submittedAt: submissionData.submittedAt,
                        databaseId: databaseTaskId
                    } : t
                )
            );

            // Update analytics
            const newAnalytics = aiAssistant.getLearningAnalytics();
            setAnalytics(prev => ({ ...prev, ...newAnalytics }));

            // Call parent callback
            if (onTaskComplete) {
                onTaskComplete({
                    taskId: task.id,
                    timeSpent: submissionData.actualTime,
                    submissionType: submissionData.submissionType
                });
            }

            // Refresh global tasks
            await refreshTasks();

        } catch (error) {
            console.error('AI task submission failed:', error);
            throw error;
        }
    };

    const generateNewTasks = () => {
        if (!roadmap || !userProfile) return;

        const newDayNumber = (learningData?.dayNumber || 1) + 1;
        const newTasks = aiAssistant.generateDailyTasks(
            roadmap,
            learningData?.currentPhase || 1,
            newDayNumber,
            userProfile
        );

        setCurrentTasks(newTasks);

        // Sync new tasks with task service
        if (newTasks.length > 0) {
            taskSyncService.syncAITasks(newTasks);

            // Dispatch event to notify other pages of new AI tasks
            window.dispatchEvent(new CustomEvent('tasksUpdated', {
                detail: {
                    action: 'ai-tasks-generated',
                    source: 'ai-learning',
                    count: newTasks.length
                }
            }));
        }

        if (onUpdateProgress) {
            onUpdateProgress({ dayNumber: newDayNumber });
        }
    };

    const handleCompleteGoal = () => {
        if (window.confirm('Are you sure you want to mark this goal as completed? This will clear your current progress and allow you to set a new goal.')) {
            completeCurrentGoal();
            window.location.href = '/assessment'; // Redirect to start new goal
        }
    };

    const handleResetGoal = async () => {
        if (window.confirm('Are you sure you want to reset your current goal? This will permanently delete all your progress and AI tasks and cannot be undone.')) {
            try {
                console.log('🔄 Starting goal reset...');

                // Delete all AI-generated tasks from database
                console.log('📤 Fetching all tasks...');
                const allTasks = await apiService.getTasks();
                console.log('📋 All tasks response:', allTasks);

                const aiTasks = allTasks.data?.tasks?.filter(task => task.isAIGenerated) || [];
                console.log('🤖 Found AI tasks to delete:', aiTasks.length, aiTasks);

                if (aiTasks.length === 0) {
                    console.log('ℹ️ No AI tasks found to delete');
                } else {
                    console.log('🗑️ Deleting AI tasks...');
                    for (const task of aiTasks) {
                        try {
                            console.log('🗑️ Deleting task:', task.id, task.name);
                            const deleteResponse = await apiService.deleteTask(task.id);
                            console.log('✅ Deleted AI task:', task.id, deleteResponse);
                        } catch (error) {
                            console.error('❌ Failed to delete AI task:', task.id, error);
                        }
                    }
                }

                // Clear AI tasks from sync service
                taskSyncService.clearAITasks();

                // Dispatch event to notify other pages that AI tasks were deleted
                window.dispatchEvent(new CustomEvent('tasksUpdated', {
                    detail: {
                        action: 'ai-tasks-reset',
                        source: 'ai-learning'
                    }
                }));

                // Reset goal
                resetCurrentGoal();
                window.location.href = '/assessment'; // Redirect to start new goal
            } catch (error) {
                console.error('Failed to reset goal and delete AI tasks:', error);
            }
        }
    };

    const formatTime = (input) => {
        if (!input || input < 0) return '00:00:00';

        // Handle both seconds and milliseconds
        const totalSeconds = input > 1000000 ? Math.floor(input / 1000) : Math.floor(input);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getTaskStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'in-progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };



    return (
        <div className="min-h-screen bg-[#111111] text-white learning-dashboard">
            <div className="w-full">
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-poppins">
                            AI Learning Dashboard
                        </h1>
                        <p className="text-lg mb-6 text-indigo-700 dark:text-gray-300">
                            Track your progress with AI-powered insights and personalized recommendations
                        </p>
                        {learningData && (
                            <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl p-4 border border-purple-400/30 inline-block">
                                <div className="text-white font-semibold">
                                    Current Learning Path: {learningData.goalData?.learningPath || 'AI Personalized'}
                                </div>
                                <div className="text-indigo-700 text-sm dark:text-gray-300">
                                    Phase {learningData.currentPhase} • Day {learningData.dayNumber}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Goal Management Section */}
                    <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-white font-bold text-xl mb-2">Goal Progress</h3>
                                    <p className="text-gray-300 text-sm">
                                        Phase {goalProgress.currentPhase} of {goalProgress.totalPhases} • {goalProgress.progress}% Complete
                                    </p>
                                    <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                                        <div
                                            className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${goalProgress.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {goalProgress.isCompleted && (
                                        <Button
                                            onClick={handleCompleteGoal}
                                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl transition-all duration-300 font-semibold"
                                        >
                                            🎉 Complete Goal
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleResetGoal}
                                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white rounded-xl transition-all duration-300 font-semibold"
                                    >
                                        🔄 Reset Goal
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Overview */}
                    {analytics && (
                        <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
                            <CardContent className="p-8">
                                <h3 className="text-white font-bold text-2xl mb-6">Your AI-Powered Progress Overview</h3>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                    <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-xl border border-blue-400/30">
                                        <div className="text-blue-400 font-semibold text-sm mb-2">Tasks Completed</div>
                                        <div className="text-indigo-900 text-3xl font-bold dark:text-white">{analytics.totalTasksCompleted || 0}</div>
                                        <div className="text-indigo-700 text-xs dark:text-blue-300">AI-generated tasks</div>
                                    </div>

                                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-xl border border-green-400/30">
                                        <div className="text-green-400 font-semibold text-sm mb-2">Efficiency Score</div>
                                        <div className="text-indigo-900 text-3xl font-bold dark:text-white">{Math.round((analytics.averageEfficiency || 0) * 100)}%</div>
                                        <div className="text-indigo-700 text-xs dark:text-green-300">AI-calculated performance</div>
                                    </div>

                                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-xl border border-purple-400/30">
                                        <div className="text-purple-400 font-semibold text-sm mb-2">Consistency Rate</div>
                                        <div className="text-indigo-900 text-3xl font-bold dark:text-white">{Math.round((analytics.consistencyRate || 0) * 25)}%</div>
                                        <div className="text-indigo-700 text-xs dark:text-purple-300">Daily completion rate</div>
                                    </div>

                                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-6 rounded-xl border border-orange-400/30">
                                        <div className="text-orange-400 font-semibold text-sm mb-2">Total Time</div>
                                        <div className="text-indigo-900 text-3xl font-bold dark:text-white">{(analytics.timeSpentTotal || 0).toFixed(1)}h</div>
                                        <div className="text-indigo-700 text-xs dark:text-orange-300">Learning time tracked</div>
                                    </div>
                                </div>

                                {/* AI Insights */}
                                {analytics.strongAreas && analytics.strongAreas.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-indigo-700 font-semibold text-lg mb-3 dark:text-white">🏆 AI-Identified Strong Areas</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {analytics.strongAreas.map((area, index) => (
                                                <span
                                                    key={index}
                                                    className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-400/30"
                                                >
                                                    {area.category} ({Math.round((area.averageEfficiency || 0) * 100)}% efficiency)
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {analytics.improvementAreas && analytics.improvementAreas.length > 0 && (
                                    <div>
                                        <h4 className="text-indigo-700 font-semibold text-lg mb-3 dark:text-white">📈 AI-Suggested Improvement Areas</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {analytics.improvementAreas.map((area, index) => (
                                                <span
                                                    key={index}
                                                    className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm border border-yellow-400/30"
                                                >
                                                    {area.category} ({Math.round((area.averageEfficiency || 0) * 100)}% efficiency)
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Today's AI-Generated Tasks */}
                    <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-bold text-2xl">Today's AI-Generated Tasks</h3>
                                <Button
                                    onClick={generateNewTasks}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl transition-all duration-300 font-semibold"
                                >
                                    🤖 Generate New AI Tasks
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {currentTasks.map((task) => {
                                    const timer = taskTimers[task.id];
                                    const isTimerRunning = timer?.isRunning || false;
                                    const elapsedTime = timer?.elapsedTime || 0;

                                    return (
                                        <div
                                            key={task.id}
                                            className="p-6 bg-gray-800/50 rounded-xl border border-gray-600 hover:border-gray-500 transition-all duration-300 learning-task-card"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h4 className="text-white font-semibold text-xl mb-2">{task.title}</h4>
                                                    <p className="text-gray-300 mb-4">{task.description}</p>

                                                    <div className="flex items-center gap-4 mb-4">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTaskStatusColor(task.status || 'pending')}`}>
                                                            {task.status || 'pending'}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                                                            {task.priority} priority
                                                        </span>
                                                        <span className="text-gray-400 text-sm">
                                                            ⏱️ {task.estimatedTime}h estimated
                                                        </span>
                                                        <span className="text-gray-400 text-sm">
                                                            📂 {task.category}
                                                        </span>
                                                        <span className="text-cyan-400 text-sm">
                                                            🤖 AI-Generated
                                                        </span>
                                                    </div>

                                                    {task.topics && (
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            {task.topics.map((topic, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs border border-blue-400/30"
                                                                >
                                                                    {topic}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>


                                            </div>

                                            {/* Task Controls */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between flex-wrap gap-4">
                                                    <div className="flex items-center gap-4 flex-wrap">
                                                        {(!task.status || task.status === 'pending') && !timer?.startTime && (
                                                            <Button
                                                                onClick={() => handleStartTask(task.id)}
                                                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl transition-all duration-300 font-semibold"
                                                            >
                                                                ▶️ Start Task
                                                            </Button>
                                                        )}

                                                        {timer?.startTime && task.status !== 'completed' && (
                                                            <TaskSubmitButton
                                                                task={{
                                                                    id: task.databaseId || task.id,
                                                                    status: task.status,
                                                                    submissionFile: task.submissionFile
                                                                }}
                                                                className="px-6 py-3 rounded-xl transition-all duration-300 font-semibold"
                                                                onSubmissionStart={() => {}}
                                                                onSubmissionComplete={async () => {
                                                                    try {
                                                                        await handleAITaskSubmission(task, {
                                                                            submissionType: 'completed',
                                                                            submissionFile: 'submitted',
                                                                            actualTime: elapsedTime / 1000 / 3600,
                                                                            completionTime: new Date().toISOString(),
                                                                            submittedAt: new Date().toISOString()
                                                                        });
                                                                    } catch (error) {
                                                                        console.error('AI task submission failed:', error);
                                                                    }
                                                                }}
                                                                expandedTask={expandedSubmission}
                                                                setExpandedTask={setExpandedSubmission}
                                                                showSubmissionForm={true}
                                                            />
                                                        )}

                                                        {task.status === 'completed' && (
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30">
                                                                    <span className="text-xl">✅</span>
                                                                    <span className="font-semibold">Completed</span>
                                                                </div>
                                                                <TaskSubmitButton
                                                                    task={{
                                                                        id: task.databaseId || task.id,
                                                                        status: task.status,
                                                                        submissionFile: task.submissionFile
                                                                    }}
                                                                    className="px-6 py-3 rounded-xl transition-all duration-300 font-semibold"
                                                                    onSubmissionStart={() => {}}
                                                                    onSubmissionComplete={() => {}}
                                                                    expandedTask={expandedSubmission}
                                                                    setExpandedTask={setExpandedSubmission}
                                                                    showSubmissionForm={false}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                                        <span>🎯 Difficulty: {task.difficulty || 3}/5</span>
                                                        <span>📊 Progress: {task.progress || 0}%</span>
                                                        {task.actualTime && (
                                                            <span>⏱️ Actual: {task.actualTime.toFixed(1)}h</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>


                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Recommendations */}
                    {recommendations && recommendations.length > 0 && (
                        <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
                            <CardContent className="p-8">
                                <h3 className="text-white font-bold text-2xl mb-6">🤖 AI-Powered Recommendations</h3>
                                <div className="space-y-4">
                                    {recommendations.map((rec, index) => (
                                        <div
                                            key={index}
                                            className="p-6 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-400/30"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="text-2xl">{rec.icon || '💡'}</div>
                                                <div className="flex-1">
                                                    <h4 className="text-white font-semibold text-lg mb-2">{rec.title}</h4>
                                                    <p className="text-gray-300 mb-3">{rec.description}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm border border-indigo-400/30">
                                                            {rec.category}
                                                        </span>
                                                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm border border-purple-400/30">
                                                            Priority: {rec.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
            

        </div>
    );
};

export default LearningDashboardScreen;