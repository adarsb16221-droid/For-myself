import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Link from '@/models/Link';
import User from '@/models/User';
import * as cheerio from 'cheerio';
import { sendEmail } from '@/lib/email';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET(req) {
  try {
    // Basic protection - usually cron jobs should have an auth header/secret
    const { searchParams } = new URL(req.url);
    if (searchParams.get('secret') !== 'hawk-cron-secret' && process.env.NODE_ENV === 'production') {
       // Enable this if needed for security
       // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Find links that have trackChanges enabled
    const links = await Link.find({ trackChanges: true }).populate('userId', 'email name');
    
    const results = [];

    for (let link of links) {
      if (!link.userId) continue;

      try {
        const response = await fetch(link.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        
        if (!response.ok) {
           console.log(`Failed to fetch ${link.url}`);
           results.push({ id: link._id, status: 'error', message: 'Fetch failed' });
           continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Remove scripts, styles to reduce tokens
        $('script, style, noscript, iframe, img, svg').remove();
        const textContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 15000); // Limit context size

        let prompt = '';
        
        if (!link.lastSummary) {
           // First time scraping
           prompt = `You are an AI tracking a website. 
Website content:
${textContent}

User's instruction for tracking: "${link.aiInstruction}"

Please provide a brief initial summary (max 3 sentences) of the current state of the page related to the instruction.`;
        } else {
           prompt = `You are an AI tracking a website for changes.
Old State Summary: ${link.lastSummary}

Current Website content:
${textContent}

User's instruction for tracking: "${link.aiInstruction}"

Task: Compare the Current Website content with the Old State Summary, specifically looking for changes related to the User's instruction (e.g., if they asked for new job postings, check if there's a new job posting).
If there is a significant change or something new that matches the instruction, respond with "CHANGED: <describe the change and the new information in detail>".
If there is NO significant change, respond EXACTLY with "NO_CHANGE".`;
        }

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GEMINI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gemini-3.5-flash',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
            temperature: 0.1
          })
        });

        const geminiData = await geminiRes.json();
        const aiResponse = geminiData.choices?.[0]?.message?.content?.trim() || '';

        if (!link.lastSummary) {
            // Save initial summary
            link.lastSummary = aiResponse;
            link.lastCheckedAt = new Date();
            await link.save();
            results.push({ id: link._id, status: 'initialized' });
        } else {
            if (aiResponse.startsWith('CHANGED:')) {
                const changeDetails = aiResponse.replace('CHANGED:', '').trim();
                
                // Send email
                await sendEmail({
                    to: link.userId.email,
                    subject: `Update on tracked link: ${link.name}`,
                    html: `
                        <h2>Change Detected on ${link.name}</h2>
                        <p>We found something new based on your instruction: <strong>"${link.aiInstruction}"</strong></p>
                        <hr/>
                        <p>${changeDetails.replace(/\n/g, '<br/>')}</p>
                        <br/>
                        <a href="${link.url}">Visit the link</a>
                    `
                });

                // Update summary so we don't alert on the same thing again
                link.lastSummary = `Previous findings: ${changeDetails}.`;
                link.lastCheckedAt = new Date();
                await link.save();
                results.push({ id: link._id, status: 'changed_and_emailed' });
            } else {
                link.lastCheckedAt = new Date();
                await link.save();
                results.push({ id: link._id, status: 'no_change' });
            }
        }

      } catch (err) {
        console.error(`Error processing link ${link.url}`, err);
        results.push({ id: link._id, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('Check Links Cron Error:', error);
    return NextResponse.json({ error: 'Failed to run cron job' }, { status: 500 });
  }
}
