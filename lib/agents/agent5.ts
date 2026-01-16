import { v4 as uuidv4 } from 'uuid'
import { AgentResult } from './orchestrator'

const BASE_URL = "https://api.on-demand.io/chat/v1"
const API_KEY = "pGdYFEt0VkaxknRL2H6F2ljfs7SsMRMw"

// Agent 5: Confidence Signal & Score Engine
const QUERY = "calculate_confidence"
const RESPONSE_MODE = "sync"
const AGENT_IDS = ["696a3892c7d6dfdf7e337ca2"] // Agent 5 ID
const ENDPOINT_ID = "predefined-xai-grok4.1-fast"
const REASONING_MODE = "grok-4-fast"

const FULFILLMENT_PROMPT = `IMPORTANT: PARSE input JSON. Do NOT echo it.

Parse this JSON:
<AGENT_DATA>
{{input}}
</AGENT_DATA>

You are Agent 5: Confidence Signal & Score Engine. Call the confidence_calculator tool to unify speech metrics.

INPUT FORMAT (from Agents 2, 3, 4):
{
  "agent2": {"pitch": 210, "volume": 0.62, "pace": 145, "stress_index": 0.71, "repetition_count": 3},
  "agent3": {"filler_words": 6, "clarity_score": 0.78, "key_phrases_repeated": ["I think", "basically"]},
  "agent4": {"eye_contact_score": 0.64, "posture_alert": true, "gesture_intensity": "low"}
}

TOOL CALL INSTRUCTION:
1. Extract agent2, agent3, agent4 from input JSON.
2. Call tool: confidence_calculator
   Input: {"agent2": agent2, "agent3": agent3, "agent4": agent4}
3. Tool returns: {"confidence_score": N, "dominant_weakness": "X"}

OUTPUT ONLY tool response JSON:
{
  "confidence_score": 82,
  "dominant_weakness": "pace"
}

Do NOT calculate scores yourself. Use ONLY tool output. No modifications.`

export interface Agent5Input {
    agent2: any // Speech Signal
    agent3: any // Fluency
    agent4: any // Body Language (mocked if deleted)
}

export async function processAgent5(input: Agent5Input) {
    const sessionId = await createChatSession()

    // Prepare input JSON for the prompt
    const inputString = JSON.stringify(input)
    const query = inputString // Pass data as the query or wrapped in format

    // Actually, prompt says "QUERY = <your_query>". We should likely send the data as the query
    // or inject it into the prompt if the API allows variables. 
    // The prompt has `{{input}}`. 
    // Let's assume we pass the input JSON as the query string so the model sees it.

    return await submitQuery(sessionId, inputString)
}

async function createChatSession(): Promise<string> {
    const url = `${BASE_URL}/sessions`
    const body = {
        agentIds: AGENT_IDS,
        externalUserId: uuidv4(),
        contextMetadata: [
            { key: "type", value: "confidence-analysis" }
        ]
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    if (!response.ok) throw new Error(`Failed to create session Agent 5: ${response.status} ${await response.text()}`)
    const data = await response.json()
    return data.data.id
}

async function submitQuery(sessionId: string, queryInput: string) {
    const url = `${BASE_URL}/sessions/${sessionId}/query`

    // Construct the prompt by replacing {{input}} manually if needed, or rely on model to see the query.
    // The user's code snippet used `QUERY` as a static string and `FULFILLMENT_PROMPT` had `{{input}}`.
    // We'll replace {{input}} in the prompt with our JSON data and send a generic query or the data itself.
    // Let's inject into prompt for robustness.

    const finalPrompt = FULFILLMENT_PROMPT.replace('{{input}}', queryInput)

    const body = {
        endpointId: ENDPOINT_ID,
        query: "analyze_confidence", // Static query trigger
        agentIds: AGENT_IDS,
        responseMode: RESPONSE_MODE,
        reasoningMode: REASONING_MODE,
        modelConfigs: {
            fulfillmentPrompt: finalPrompt,
            temperature: 0.1,
            topP: 0.9,
            maxTokens: 500
        },
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    if (!response.ok) throw new Error(`Query failed Agent 5: ${await response.text()}`)
    return await response.json()
}
