import { NextRequest, NextResponse } from 'next/server'
import { processAgent5 } from '@/lib/agents/agent5'
import { processAgent6 } from '@/lib/agents/agent6'

const fs = require('fs');
const path = require('path');

function logDebug(message: string) {
    const logPath = path.join(process.cwd(), 'debug_analysis.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

export async function POST(req: NextRequest) {
    try {
        logDebug("Received POST request to /api/agent/analyze");
        const body = await req.json()
        const { agent2, agent3, mode, transcript } = body

        logDebug(`Input Mode: ${mode}`);
        logDebug(`Transcript Length: ${transcript?.length || 0}`);
        logDebug(`Agent 2 Data: ${JSON.stringify(agent2)}`);

        // --- Dynamic MOCKING of Agent 4 (Body Language) based on Agent 2 (Audio) ---
        // Logic: 
        // - High Stress -> Tense posture (true), Low gestures
        // - Monotone (Low Pitch Variance) -> Low gestures
        // - Fast Pace -> High gesture intensity
        // - Good Volume/Pace -> Good Eye Contact (simulated confidence)

        const stress = agent2?.stress_index || 0;
        const pace = agent2?.pace || 130;

        let mockPosture = false; // "Slouching"
        let mockGestures = 'medium';
        let mockEyeContact = 0.75;

        // 1. Posture Calculation
        if (stress > 0.6) {
            mockPosture = true; // High stress = bad posture/tension
        }

        // 2. Gesture Intensity
        if (pace > 160) {
            mockGestures = 'high';
        } else if (pace < 110 || stress > 0.7) {
            mockGestures = 'low'; // Frozen by stress or speaking very slowly
        }

        // 3. Eye Contact (correlated with volume consistency/confidence)
        if (stress < 0.3) {
            mockEyeContact = 0.85; // Low stress = high eye contact
        } else if (stress > 0.7) {
            mockEyeContact = 0.45; // High stress = look away
        }

        const agent4Mock = {
            eye_contact_score: mockEyeContact,
            posture_alert: mockPosture,
            gesture_intensity: mockGestures
        }

        logDebug(`Generated Mock Agent 4 Data: ${JSON.stringify(agent4Mock)}`);

        // 1. Run Agent 5 (Confidence)
        // Agent 5 expects { agent2, agent3, agent4 }
        const agent5Input = {
            agent2,
            agent3,
            agent4: agent4Mock
        }

        logDebug("Running Agent 5 (Confidence)...")
        const agent5Result = await processAgent5(agent5Input)
        logDebug(`Agent 5 Raw Result: ${JSON.stringify(agent5Result)}`)

        let confidenceMetrics = agent5Result.data?.answer
            ? JSON.parse(agent5Result.data.answer)
            : agent5Result.data

        // Robust parsing check
        if (typeof confidenceMetrics === 'string') {
            try { confidenceMetrics = JSON.parse(confidenceMetrics); } catch (e) { }
        }
        if (!confidenceMetrics) confidenceMetrics = agent5Result // Fallback

        // 2. Run Agent 6 (Alignment)
        // Agent 6 expects { agent2, agent3, agent4, agent5, mode }
        const agent6Input = {
            agent2,
            agent3,
            agent4: agent4Mock,
            agent5: confidenceMetrics,
            mode: mode || 'Interview',
            transcript: transcript // Added Transcript
        }

        logDebug("Running Agent 6 (Alignment) with Transcript...")
        const agent6Result = await processAgent6(agent6Input)
        logDebug(`Agent 6 Raw Result: ${JSON.stringify(agent6Result)}`)

        let alignmentMetrics = agent6Result.data?.answer
            ? JSON.parse(agent6Result.data.answer)
            : agent6Result.data

        if (typeof alignmentMetrics === 'string') {
            try { alignmentMetrics = JSON.parse(alignmentMetrics); } catch (e) { }
        }
        if (!alignmentMetrics) alignmentMetrics = agent6Result // Fallback

        return NextResponse.json({
            confidenceMetrics,
            alignmentMetrics
        })

    } catch (error: any) {
        logDebug(`Analysis Error: ${error.message}`);
        console.error("Analysis Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
