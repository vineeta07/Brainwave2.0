'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useSearchParams } from 'next/navigation'
import { Clock, TrendingUp, AlertCircle, CheckCircle, Target, Video } from 'lucide-react'
import Link from 'next/link'
import ConfidenceScoreCard from '@/components/ConfidenceScoreCard'
import HeatmapView from '@/components/HeatmapView'
import {
  generateMockConfidenceData,
  generateMockHeatmapData,
} from '@/lib/mockData'
import { ConfidenceData, HeatmapData } from '@/lib/types'

export default function InsightsPage() {
  const { practiceHistory } = useStore()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const [session, setSession] = useState<any>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [confidenceData, setConfidenceData] = useState<ConfidenceData | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])

  useEffect(() => {
    if (sessionId) {
      const found = practiceHistory.find(s => s.id === sessionId)
      setSession(found)
      if (found) {
        generateInsights(found)
        // Load mock data (in production, from backend)
        setConfidenceData(generateMockConfidenceData())
        setHeatmapData(generateMockHeatmapData())
      }
    } else if (practiceHistory.length > 0) {
      const lastSession = practiceHistory[practiceHistory.length - 1]
      setSession(lastSession)
      generateInsights(lastSession)
      setConfidenceData(generateMockConfidenceData())
      setHeatmapData(generateMockHeatmapData())
    }
  }, [sessionId, practiceHistory])

  const generateInsights = (sessionData: any) => {
    const generated: string[] = []

    // Analyze pace
    if (sessionData.metrics?.pace?.length > 0) {
      const avgPace = sessionData.metrics.pace.reduce((a: number, b: number) => a + b, 0) / sessionData.metrics.pace.length
      if (avgPace > 180) {
        generated.push(`Your pace increased during the session, averaging ${Math.round(avgPace)} words per minute.`)
      } else if (avgPace < 120) {
        generated.push(`Your pace was measured at ${Math.round(avgPace)} words per minute, which is slower than typical.`)
      } else {
        generated.push(`Your pace remained steady throughout, averaging ${Math.round(avgPace)} words per minute.`)
      }
    }

    // Analyze stress
    if (sessionData.metrics?.stress?.some((s: number) => s > 0.6)) {
      const highStressMoments = sessionData.metrics.stress.filter((s: number) => s > 0.6).length
      generated.push(`Stress patterns appeared ${highStressMoments} time(s) during your practice. This is common and manageable.`)
    }

    // Analyze clarity
    if (sessionData.metrics?.fillerWords?.reduce((a: number, b: number) => a + b, 0) > 10) {
      generated.push(`Filler words were used throughout the session. Consider pausing instead of using filler words.`)
    }

    // Analyze stuttering/repetition
    if (sessionData.metrics?.stuttering?.some((s: number) => s > 0.3)) {
      generated.push(`Repetition and hesitation patterns were observed. These are common and can improve with guided practice.`)
    }

    if (generated.length === 0) {
      generated.push(`Your delivery was strong throughout the session. Keep practicing to maintain consistency!`)
    }

    setInsights(generated)
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Practice Insights</h1>
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-600">No session data available. Complete a practice session to see insights.</p>
        </div>
      </div>
    )
  }

  const duration = session.endTime
    ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000)
    : 0

  const timelineEvents = [
    {
      time: '0:00',
      event: 'Session started',
      type: 'start',
    },
    ...(session.metrics?.stress?.map((s: number, idx: number) =>
      s > 0.6 ? {
        time: `${Math.floor(idx * 5 / 60)}:${String(Math.floor((idx * 5) % 60)).padStart(2, '0')}`,
        event: 'Stress pattern observed',
        type: 'stress',
      } : null
    ).filter(Boolean) || []),
    ...(session.metrics?.pace?.map((p: number, idx: number) =>
      p > 180 ? {
        time: `${Math.floor(idx * 5 / 60)}:${String(Math.floor((idx * 5) % 60)).padStart(2, '0')}`,
        event: 'Pace increased',
        type: 'pace',
      } : null
    ).filter(Boolean) || []),
    {
      time: session.endTime ? new Date(session.endTime).toLocaleTimeString() : 'End',
      event: 'Session ended',
      type: 'end',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Practice Insights</h1>

      {/* Confidence Score Card */}
      {(session.confidenceMetrics || confidenceData) && (
        <ConfidenceScoreCard
          data={session.confidenceMetrics ? {
            score: session.confidenceMetrics.confidence_score,
            factors: [
              { name: 'Pace', impact: 25 },
              { name: 'Volume', impact: 20 },
              { name: 'Clarity', impact: 20 },
              { name: 'Eye Contact', impact: 15 },
              { name: 'Stress', impact: 20 }
            ],
            dominantWeakness: session.confidenceMetrics.dominant_weakness,
            trend: [65, 68, 72, session.confidenceMetrics.confidence_score]
          } : confidenceData}
        />
      )}

      {/* Alignment Analysis Card (Agent 6) */}
      {session.alignmentMetrics && (
        <div className={`p-6 rounded-lg shadow-sm border ${session.alignmentMetrics.tone_match ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${session.alignmentMetrics.tone_match ? 'text-green-900' : 'text-yellow-900'}`}>
            <Target className="w-5 h-5" />
            Purpose & Emotion Alignment
          </h2>

          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${session.alignmentMetrics.tone_match ? 'bg-green-200' : 'bg-yellow-200'}`}>
              {session.alignmentMetrics.tone_match ? <CheckCircle className="w-6 h-6 text-green-700" /> : <AlertCircle className="w-6 h-6 text-yellow-700" />}
            </div>
            <div>
              <h3 className="font-medium text-lg text-gray-900">
                {session.alignmentMetrics.tone_match ? "Tone Aligned with Context" : "Tone Mismatch Detected"}
              </h3>
              <p className="text-gray-700 mt-2">
                {session.alignmentMetrics.suggestion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Session Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Session Summary</h2>
            <p className="text-gray-600 text-sm">
              {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Mode</p>
            <p className="font-semibold text-gray-900 capitalize">{session.mode}</p>
          </div>
        </div>
        {session.scenario && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Scenario</p>
            <p className="font-medium text-gray-900">{session.scenario}</p>
          </div>
        )}
      </div>

      {/* Video Analysis Card (Agent 4) */}
      {session.videoMetrics && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            Video Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Eye Contact */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">Eye Contact</span>
                <span className={`text-sm px-2 py-0.5 rounded-full ${session.videoMetrics.eye_contact_score > 0.7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                  {Math.round(session.videoMetrics.eye_contact_score * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all ${session.videoMetrics.eye_contact_score > 0.7 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  style={{ width: `${session.videoMetrics.eye_contact_score * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Target: &gt;70% maintenance
              </p>
            </div>

            {/* Posture */}
            <div className={`p-4 rounded-lg border ${session.videoMetrics.posture_alert ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
              }`}>
              <span className="font-medium text-gray-700 block mb-2">Posture Check</span>
              <div className="flex items-center gap-2">
                {session.videoMetrics.posture_alert ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Slouching Detected</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700">Good Posture</span>
                  </>
                )}
              </div>
            </div>

            {/* Gesture Intensity */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="font-medium text-gray-700 block mb-2">Gestures</span>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{session.videoMetrics.gesture_intensity} Intensity</span>
                <div className="flex gap-1">
                  {['low', 'medium', 'high'].map((level, i) => (
                    <div
                      key={level}
                      className={`w-2 h-6 rounded-sm ${['low', 'medium', 'high'].indexOf(session.videoMetrics.gesture_intensity) >= i
                        ? 'bg-blue-500'
                        : 'bg-gray-200'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap View */}
      {heatmapData.length > 0 && (
        <HeatmapView data={heatmapData} duration={duration} />
      )}

      {/* Natural Language Explanation */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">What We Observed</h2>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Where Practice Changed
        </h2>
        <div className="space-y-4">
          {timelineEvents.map((event, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 text-sm text-gray-600 font-mono">
                {event.time}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {event.type === 'start' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {event.type === 'stress' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                  {event.type === 'pace' && <TrendingUp className="w-4 h-4 text-blue-500" />}
                  {event.type === 'end' && <CheckCircle className="w-4 h-4 text-gray-400" />}
                  <p className="text-gray-700">{event.event}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Micro-Practice Suggestions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-500" />
          Suggested Next Practice
        </h2>
        <div className="space-y-4">
          <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg">
            <p className="font-medium text-gray-900 mb-2">15-30 Second Exercise</p>
            <p className="text-sm text-gray-700 mb-3">
              Practice maintaining steady pace during topic transitions. Start with a brief pause, then continue.
            </p>
            <p className="text-xs text-gray-600">
              <strong>Goal:</strong> Reduce pace spikes during transitions
            </p>
          </div>
          <div className="bg-accent-50 border border-accent-200 p-4 rounded-lg">
            <p className="font-medium text-gray-900 mb-2">Breathing Exercise</p>
            <p className="text-sm text-gray-700 mb-3">
              Before starting a new section, take a deep breath. This helps manage stress patterns naturally.
            </p>
            <p className="text-xs text-gray-600">
              <strong>Goal:</strong> Reduce stress spikes at section starts
            </p>
          </div>
        </div>
      </div>

      {/* Supportive Message */}
      <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-green-900">Remember</h3>
        <p className="text-green-800 text-sm">
          These insights are observations to help you understand your speech patterns. They're not evaluations or judgments.
          Every voice is unique, and improvement is a journey. Keep practicing at your own pace, and celebrate your progress along the way.
        </p>
      </div>
    </div>
  )
}
