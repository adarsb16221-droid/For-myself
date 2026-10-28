import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Task from '@/models/Task';
import Journal from '@/models/Journal';
import fs from 'fs';
import path from 'path';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || req.headers.get('x-migration-secret');
    const validSecret = process.env.MIGRATION_SECRET;

    // Strictly protect migration route: cannot run without configured secret
    if (!validSecret || secret !== validSecret) {
      return NextResponse.json({ 
        error: 'Forbidden. Migration is disabled or unauthorized.' 
      }, { status: 403 });
    }

    await connectToDatabase();
    
    const backupDir = path.join(process.cwd(), 'backup');
    const tasksFile = path.join(backupDir, 'tasks.json');
    const journalFile = path.join(backupDir, 'journal.json');
    
    let tasksMigrated = 0;
    let journalsMigrated = 0;
    
    if (fs.existsSync(tasksFile)) {
        const tasksData = JSON.parse(fs.readFileSync(tasksFile, 'utf-8'));
        if (Array.isArray(tasksData) && tasksData.length > 0) {
            // Note: deleteMany is only permitted when explicitly authenticated with MIGRATION_SECRET
            await Task.deleteMany({}); 
            
            const mappedTasks = tasksData.map(t => ({
                text: t.text,
                category: t.category,
                priority: t.priority,
                isRegular: t.isRegular,
                completed: t.completed,
                completedAt: t.completedAt,
                history: t.history || [],
                createdAt: t.createdAt || new Date().toISOString()
            }));
            
            await Task.insertMany(mappedTasks);
            tasksMigrated = mappedTasks.length;
        }
    }
    
    if (fs.existsSync(journalFile)) {
        const journalData = JSON.parse(fs.readFileSync(journalFile, 'utf-8'));
        const journalEntries = Object.entries(journalData);
        if (journalEntries.length > 0) {
            await Journal.deleteMany({});
            
            const mappedJournals = journalEntries.map(([date, content]) => ({
                date,
                content
            }));
            
            await Journal.insertMany(mappedJournals);
            journalsMigrated = mappedJournals.length;
        }
    }
    
    return NextResponse.json({ 
        message: 'Migration successful', 
        tasksMigrated, 
        journalsMigrated 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed', details: error.message }, { status: 500 });
  }
}
