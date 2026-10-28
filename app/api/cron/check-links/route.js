import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Link from '@/models/Link';
import User from '@/models/User';
import * as cheerio from 'cheerio';
import { sendEmail } from '@/lib/email';
import { isSafePublicUrl } from '@/lib/urlValidator';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET || 'hawk-cron-secret';
    const authHeader = req.headers.get('authorization');
    const secretParam = searchParams.get('secret');
    const isAuthorized = (authHeader === `Bearer ${cronSecret}`) || (secretParam === cronSecret);

    if (!isAuthorized && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized. Invalid cron secret.' }, { status: 401 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    await connectToDatabase();
    
    // Find links that have trackChanges enabled (limit to 50 links per batch for scalability)
    const links = await Link.find({ trackChanges: true })
      .populate('userId', 'email name')
      .limit(50);
    
    const results = [];

    for (let link of links) {
      if (!link.userId || !link.url) continue;

      if (!isSafePublicUrl(link.url)) {
        console.warn(`Skipping unsafe URL: ${link.url}`);
        results.push({ id: link._id, status: 'skipped_unsafe_url' });
        continue;
      }

      try {
        const response = await fetch(link.url, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
          },
          signal: AbortSignal.timeout(8000) // 8-second timeout
        });
        
        if (!response.ok) {
           results.push({ id: link._id, status: 'error', message: `Fetch failed (${response.status})` });
           continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Remove scripts, styles to reduce tokens
        $('script, style, noscript, iframe, img, svg').remove();
        const textContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 15000); // Limit context size

        let prompt = '';
        
        if (!link.lastSummary) {
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
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (!geminiRes.ok) {
          results.push({ id: link._id, status: 'gemini_error' });
          continue;
        }

        const geminiData = await geminiRes.json();
        const aiResponse = geminiData.choices?.[0]?.message?.content?.trim() || '';

        if (!link.lastSummary) {
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
        console.error(`Error processing link ${link.url}:`, err.message);
        results.push({ id: link._id, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('Check Links Cron Error:', error);
    return NextResponse.json({ error: 'Failed to run cron job' }, { status: 500 });
  }
}
