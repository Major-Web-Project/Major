#!/usr/bin/env node
/**
 * Migration script to add multi-goal support to existing users
 * This script updates existing User documents to include goals array and activeGoalId
 * and ensures existing Goal documents are properly linked to users
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/User.js";
import Goal from "../../models/Goal.js";

// Load environment variables
dotenv.config();

async function runMigration() {
    try {
        console.log('🚀 Starting multi-goal support migration...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Step 1: Update all existing users to have empty goals array if not present
        console.log('\n📝 Step 1: Updating User documents...');

        const usersUpdateResult = await User.updateMany(
            { goals: { $exists: false } },
            {
                $set: {
                    goals: [],
                    activeGoalId: null
                }
            }
        );

        console.log(`   Updated ${usersUpdateResult.modifiedCount} users with goals array`);

        // Step 2: Link existing goals to users' goals array
        console.log('\n🔗 Step 2: Linking existing goals to users...');

        const goals = await Goal.find({}).populate('user');
        let linkedGoalsCount = 0;
        let activeGoalsSet = 0;

        for (const goal of goals) {
            if (goal.user) {
                // Add goal to user's goals array if not already present
                const user = await User.findById(goal.user._id);
                if (user && !user.goals.includes(goal._id)) {
                    user.goals.push(goal._id);

                    // Set as active goal if user doesn't have one
                    if (!user.activeGoalId) {
                        user.activeGoalId = goal._id;
                        activeGoalsSet++;
                    }

                    await user.save();
                    linkedGoalsCount++;
                }
            }
        }

        console.log(`   Linked ${linkedGoalsCount} goals to users`);
        console.log(`   Set ${activeGoalsSet} active goals for users`);

        // Step 3: Verify migration results
        console.log('\n🔍 Step 3: Verifying migration results...');

        const totalUsers = await User.countDocuments();
        const usersWithGoalsArray = await User.countDocuments({ goals: { $exists: true } });
        const usersWithGoals = await User.countDocuments({ goals: { $not: { $size: 0 } } });
        const usersWithActiveGoal = await User.countDocuments({ activeGoalId: { $ne: null } });

        console.log(`   Total users: ${totalUsers}`);
        console.log(`   Users with goals array: ${usersWithGoalsArray}`);
        console.log(`   Users with actual goals: ${usersWithGoals}`);
        console.log(`   Users with active goal: ${usersWithActiveGoal}`);

        // Step 4: Add personalNeeds field to existing goals (will be null by default)
        console.log('\n📋 Step 4: Adding personalNeeds field to existing goals...');

        const goalsUpdateResult = await Goal.updateMany(
            { personalNeeds: { $exists: false } },
            { $set: { personalNeeds: null } }
        );

        console.log(`   Updated ${goalsUpdateResult.modifiedCount} goals with personalNeeds field`);

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Updated ${usersUpdateResult.modifiedCount} users with goals array`);
        console.log(`   - Linked ${linkedGoalsCount} existing goals to users`);
        console.log(`   - Set ${activeGoalsSet} active goals`);
        console.log(`   - Updated ${goalsUpdateResult.modifiedCount} goals with personalNeeds field`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Check for confirmation flag
if (process.argv.includes('--confirm')) {
    runMigration();
} else {
    console.log('⚠️  WARNING: This migration will modify existing user and goal data!');
    console.log('🔄 To proceed, run: node 001-add-multi-goal-support.js --confirm');
    console.log('\n📋 This migration will:');
    console.log('   1. Add goals array and activeGoalId fields to all users');
    console.log('   2. Link existing goals to their respective users');
    console.log('   3. Set the first goal as active goal for users');
    console.log('   4. Add personalNeeds field to existing goals');
    console.log('\n💡 Make sure to backup your database before running this migration!');
}