import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import Modal from '../ui/modal';
import FileUpload from './FileUpload';
import { apiService } from '../../services/api';

export const TaskSubmissionModal = ({ task, isOpen, onClose, onSubmit }) => {
    const [submissionType, setSubmissionType] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [timeSpent, setTimeSpent] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [startTime, setStartTime] = useState(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen && task?.status !== 'completed') {
            setSubmissionType('');
            setSelectedFile(null);
            setTimeSpent(0);
            setIsTimerRunning(false);
            setStartTime(null);
        }
    }, [isOpen, task]);

    // Timer functionality
    useEffect(() => {
        let interval = null;
        if (isTimerRunning && startTime) {
            interval = setInterval(() => {
                setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } else if (!isTimerRunning) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, startTime]);

    const startTimer = () => {
        setStartTime(Date.now() - timeSpent * 1000);
        setIsTimerRunning(true);
    };

    const pauseTimer = () => {
        setIsTimerRunning(false);
    };



    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        // Auto-detect submission type based on file extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (['pdf'].includes(extension)) {
            setSubmissionType('pdf');
        } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
            setSubmissionType('excel');
        }
    };

    const handleSubmit = async () => {
        if (!submissionType || !selectedFile) {
            alert('Please select a submission type and upload a file');
            return;
        }

        setUploading(true);
        try {
            console.log('Starting file upload...', {
                taskId: task.id,
                submissionType,
                fileName: selectedFile.name,
                fileSize: selectedFile.size
            });

            // Upload file first
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('taskId', task.id);
            formData.append('submissionType', submissionType);

            console.log('FormData prepared, uploading...');
            const uploadResponse = await apiService.uploadTaskSubmission(formData);
            console.log('Upload response:', uploadResponse);

            if (!uploadResponse.data || !uploadResponse.data.filePath) {
                throw new Error('Invalid upload response');
            }

            // Update task with submission data
            const submissionData = {
                ...task,
                status: 'completed',
                submissionType,
                submissionFile: uploadResponse.data.filePath,
                actualTime: timeSpent / 3600, // Convert to hours
                completionTime: new Date().toLocaleTimeString(),
                submittedAt: new Date().toISOString()
            };

            console.log('Updating task with submission data:', submissionData);
            await onSubmit(submissionData);

            // Dispatch event to notify other pages of task update
            window.dispatchEvent(new CustomEvent('tasksUpdated', {
                detail: {
                    taskId: task.id,
                    action: 'completed',
                    source: 'modal'
                }
            }));

            // Reset form state
            setSubmissionType('');
            setSelectedFile(null);
            setTimeSpent(0);
            setIsTimerRunning(false);
            setStartTime(null);

            onClose();
        } catch (error) {
            console.error('Submission failed:', error);

            // More detailed error message
            let errorMessage = 'Failed to submit task. ';
            if (error.response) {
                errorMessage += `Server error: ${error.response.data?.message || error.response.statusText}`;
            } else if (error.request) {
                errorMessage += 'Network error. Please check your connection.';
            } else {
                errorMessage += error.message || 'Unknown error occurred.';
            }

            alert(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleViewSubmission = async () => {
        if (task.submissionFile) {
            try {
                const response = await apiService.viewTaskSubmission(task.id);
                // Open file in new tab
                window.open(response.data.fileUrl, '_blank');
            } catch (error) {
                console.error('Failed to view submission:', error);
                alert('Failed to view submission file.');
            }
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={task?.status === 'completed' ? 'View Submission' : 'Submit Task'}
            size="xl"
        >
            <div className="space-y-6">
                {/* Task Info */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">{task?.name}</h3>
                    <p className="text-gray-300 text-sm">
                        Priority: <span className={`font-medium ${task?.priority === 'high' ? 'text-red-400' :
                            task?.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'
                            }`}>{task?.priority}</span>
                    </p>
                    {task?.notes && (
                        <p className="text-gray-400 text-sm mt-2">{task.notes}</p>
                    )}
                </div>

                {task?.status === 'completed' ? (
                    // View submission for completed tasks
                    <div className="space-y-4">
                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-green-400 text-xl">✅</span>
                                <span className="text-green-400 font-semibold">Task Completed</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-400">Submission Type:</span>
                                    <span className="text-white ml-2 font-medium">
                                        {task.submissionType === 'pdf' ? '📄 PDF' : '📊 Excel'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Time Spent:</span>
                                    <span className="text-white ml-2 font-medium">
                                        {task.actualTime ? `${task.actualTime.toFixed(1)}h` : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Submitted:</span>
                                    <span className="text-white ml-2 font-medium">
                                        {task.submittedAt ? new Date(task.submittedAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleViewSubmission}
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white py-3"
                        >
                            View Your Submission
                        </Button>
                    </div>
                ) : (
                    // Submission form for non-completed tasks
                    <div className="space-y-6">
                        {/* Timer Section */}
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <span className="text-xl">⏱️</span>
                                Task Timer
                            </h4>
                            <div className="flex items-center justify-between">
                                <div className="text-3xl font-mono text-cyan-400">
                                    {formatTime(timeSpent)}
                                </div>
                                <div className="flex gap-2">
                                    {!isTimerRunning ? (
                                        <Button
                                            onClick={startTimer}
                                            className="bg-green-500 hover:bg-green-400 text-white px-4 py-2"
                                        >
                                            ▶️ Start
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={pauseTimer}
                                            className="bg-yellow-500 hover:bg-yellow-400 text-white px-4 py-2"
                                        >
                                            ⏸️ Pause
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submission Type Selection */}
                        <div>
                            <h4 className="text-white font-semibold mb-3">Select Submission Type</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    onClick={() => setSubmissionType('pdf')}
                                    className={`p-4 border-2 rounded-lg transition-all ${submissionType === 'pdf'
                                        ? 'border-red-500 bg-red-500/20 text-red-400'
                                        : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-red-400'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">📄</div>
                                        <div className="font-medium">PDF Document</div>
                                    </div>
                                </Button>
                                <Button
                                    onClick={() => setSubmissionType('excel')}
                                    className={`p-4 border-2 rounded-lg transition-all ${submissionType === 'excel'
                                        ? 'border-green-500 bg-green-500/20 text-green-400'
                                        : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-green-400'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">📊</div>
                                        <div className="font-medium">Excel File</div>
                                    </div>
                                </Button>
                            </div>
                        </div>

                        {/* File Upload */}
                        {submissionType && (
                            <div>
                                <h4 className="text-white font-semibold mb-3">Upload Your File</h4>
                                <FileUpload
                                    onChange={handleFileSelect}
                                    disabled={uploading}
                                    acceptedTypes={submissionType === 'pdf' ? '.pdf' : '.xlsx,.xls,.csv'}
                                />
                                {selectedFile && (
                                    <div className="mt-2 p-3 bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">
                                                {submissionType === 'pdf' ? '📄' : '📊'}
                                            </span>
                                            <span className="text-white font-medium">{selectedFile.name}</span>
                                            <span className="text-gray-400 text-sm">
                                                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <Button
                                onClick={handleSubmit}
                                disabled={!submissionType || !selectedFile || uploading}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white py-3 disabled:opacity-50 min-h-[48px]"
                            >
                                {uploading ? (
                                    <>
                                        <span className="mr-2">⏳</span>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <span className="mr-2">📤</span>
                                        Submit Task
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={onClose}
                                className="sm:px-6 bg-gray-600 hover:bg-gray-500 text-white py-3 min-h-[48px]"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};