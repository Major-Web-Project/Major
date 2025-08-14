#!/usr/bin/env node
/**
 * Cleanup script for test/development files
 * Use this to safely remove test uploads and reset the system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads/submissions');

async function cleanupTestFiles() {
    console.log('🧹 Starting cleanup of test files...\n');
    
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Check if uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            console.log('📁 Uploads directory does not exist');
            return;
        }
        
        // Get all files in uploads directory
        const files = fs.readdirSync(uploadsDir);
        console.log(`📊 Found ${files.length} files in uploads directory`);
        
        if (files.length === 0) {
            console.log('✨ No files to clean up');
            return;
        }
        
        // Show files that will be deleted
        console.log('\n📋 Files to be deleted:');
        files.forEach((file, index) => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            console.log(`   ${index + 1}. ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
        });
        
        // Calculate total size
        const totalSize = files.reduce((total, file) => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            return total + stats.size;
        }, 0);
        
        console.log(`\n💾 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        
        // Ask for confirmation (in a real script, you'd use readline)
        console.log('\n⚠️  WARNING: This will permanently delete all uploaded files!');
        console.log('🔄 To proceed, run: node cleanup-test-files.js --confirm');
        
        // Check for confirmation flag
        if (!process.argv.includes('--confirm')) {
            console.log('❌ Cleanup cancelled. Use --confirm flag to proceed.');
            return;
        }
        
        // Delete all files
        let deletedCount = 0;
        for (const file of files) {
            try {
                const filePath = path.join(uploadsDir, file);
                fs.unlinkSync(filePath);
                deletedCount++;
                console.log(`🗑️  Deleted: ${file}`);
            } catch (error) {
                console.error(`❌ Failed to delete ${file}:`, error.message);
            }
        }
        
        console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} files`);
        console.log('💡 Note: Database records still exist. Users will see "file not found" errors.');
        console.log('💡 Consider also clearing test data from the database if needed.');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
    }
}

// Run cleanup
cleanupTestFiles();