import React, { useState, useEffect, useRef } from 'react';
import { TeacherDiego } from './components/TeacherDiego';
import { StudentCamera } from './components/StudentCamera';
import { MicrophoneButton } from './components/MicrophoneButton';
import { LEVELS } from './constants';
import { analyzeStudentAnswer, generateTeacherSpeech, AnalysisResult } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Lightbulb, Volume2, ArrowRight, RotateCcw, Play } from 'lucide-react';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [studentAnswer, setStudentAnswer] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  const [score, setScore] = useState({ correct: 0, total: 0 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const currentLevel = LEVELS[currentLevelIndex];
  const currentQuestion = currentLevel?.questions[currentQuestionIndex];

  const playAudio = async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
        sourceNodeRef.current.disconnect();
      }

      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let audioBuffer: AudioBuffer;

      // Check for RIFF header (WAV)
      if (bytes.length > 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
         const bufferCopy = bytes.buffer.slice(0);
         audioBuffer = await ctx.decodeAudioData(bufferCopy);
      } else {
         // Assume raw PCM 16-bit 24kHz mono
         const int16Array = new Int16Array(bytes.buffer);
         const float32Array = new Float32Array(int16Array.length);
         for (let i = 0; i < int16Array.length; i++) {
           float32Array[i] = int16Array[i] / 32768.0;
         }
         audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
         audioBuffer.getChannelData(0).set(float32Array);
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      sourceNodeRef.current = source;

      setIsSpeaking(true);

      source.onended = () => {
        setIsSpeaking(false);
      };

      source.start();
    } catch (e) {
      console.error("Audio playback failed", e);
      setIsSpeaking(false);
      throw e;
    }
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    try {
      const audioData = await generateTeacherSpeech(text);
      if (audioData) {
        await playAudio(audioData);
      } else {
        throw new Error("No audio data received");
      }
    } catch (err) {
      console.log("Falling back to Web Speech API", err);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStart = async () => {
    setHasStarted(true);
    await speakText("Hello! I am Teacher Diego. Let's practice English together. " + currentQuestion);
  };

  const handleTranscription = async (text: string) => {
    setStudentAnswer(text);
    setIsAnalyzing(true);
    
    const result = await analyzeStudentAnswer(currentQuestion, text);
    setAnalysis(result);
    setIsAnalyzing(false);
    
    setScore(prev => ({
      correct: prev.correct + (result.isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Construct feedback speech
    let feedbackText = `I heard: ${text}. `;
    if (result.isCorrect) {
      feedbackText += `${result.encouragement} That is correct!`;
    } else {
      feedbackText += `The correct sentence is: ${result.correction}. ${result.tip}`;
      if (result.pronunciationWords && result.pronunciationWords.length > 0) {
        feedbackText += ` Try to pronounce these words again: ${result.pronunciationWords.join(', ')}.`;
      }
    }
    
    await speakText(feedbackText);
  };

  const handleNextQuestion = async () => {
    setStudentAnswer(null);
    setAnalysis(null);
    
    let nextQIdx = currentQuestionIndex + 1;
    let nextLvlIdx = currentLevelIndex;
    
    if (nextQIdx >= currentLevel.questions.length) {
      nextQIdx = 0;
      nextLvlIdx++;
    }
    
    if (nextLvlIdx < LEVELS.length) {
      setCurrentLevelIndex(nextLvlIdx);
      setCurrentQuestionIndex(nextQIdx);
      const nextQuestion = LEVELS[nextLvlIdx].questions[nextQIdx];
      await speakText(nextQuestion);
    } else {
      await speakText("Congratulations! You have finished all the levels. Great job practicing your English!");
    }
  };

  const handleRetry = async () => {
    setStudentAnswer(null);
    setAnalysis(null);
    await speakText("Let's try again. " + currentQuestion);
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Teacher Diego</h1>
          <p className="text-slate-500 mb-8">Your interactive AI English tutor</p>
          
          <div className="flex justify-center mb-8">
            <TeacherDiego isSpeaking={false} />
          </div>
          
          <p className="text-lg mb-8">
            Ready to practice speaking English? We'll need access to your microphone and camera.
          </p>
          
          <button 
            onClick={handleStart}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            <Play size={24} /> Start Learning
          </button>
        </div>
      </div>
    );
  }

  const isFinished = currentLevelIndex >= LEVELS.length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Header / Progress */}
      <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-600 hidden sm:block">Teacher Diego</h1>
          {!isFinished && (
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
              Level {currentLevel.id}: {currentLevel.title}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-slate-500">
            Score: <span className="text-emerald-600 font-bold">{score.correct}/{score.total}</span>
          </div>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${score.total === 0 ? 0 : (score.correct / score.total) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Teacher & Camera */}
        <div className="lg:col-span-5 flex flex-col gap-6 items-center lg:items-start">
          
          {/* Teacher Diego Avatar */}
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-md p-6 flex flex-col items-center border border-slate-100">
            <TeacherDiego isSpeaking={isSpeaking} />
            <div className="mt-4 text-center">
              <h2 className="font-bold text-lg">Teacher Diego</h2>
              <p className="text-sm text-slate-500">English Tutor (A1)</p>
            </div>
            
            {/* Teacher Speech Bubble */}
            {!isFinished && (
              <AnimatePresence mode="wait">
                <motion.div 
                  key={analysis ? 'feedback' : 'question'}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute -right-4 md:-right-12 top-10 bg-blue-600 text-white p-4 rounded-2xl rounded-tl-none shadow-xl max-w-[250px] z-10"
                >
                  <p className="text-sm md:text-base font-medium">
                    {analysis ? analysis.encouragement : currentQuestion}
                  </p>
                  <button 
                    onClick={() => speakText(analysis ? analysis.encouragement : currentQuestion)}
                    className="mt-2 p-1.5 bg-blue-500 hover:bg-blue-400 rounded-full transition-colors"
                  >
                    <Volume2 size={16} />
                  </button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Student Camera */}
          <div className="w-full max-w-sm flex justify-center lg:justify-start">
            <StudentCamera />
          </div>
          
        </div>

        {/* Right Column: Interaction & Feedback */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {isFinished ? (
            <div className="bg-white rounded-3xl shadow-md p-8 text-center flex flex-col items-center justify-center h-full border border-slate-100">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Course Completed!</h2>
              <p className="text-lg text-slate-600 mb-8">
                You answered {score.total} questions and got {score.correct} correct. 
                Keep practicing your English!
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
              >
                Start Over
              </button>
            </div>
          ) : (
            <>
              {/* Current Question Panel */}
              <div className="bg-white rounded-3xl shadow-md p-6 md:p-8 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Current Question</h3>
                <p className="text-2xl md:text-3xl font-medium text-slate-800 mb-8">
                  {currentQuestion}
                </p>
                
                <div className="flex flex-col items-center justify-center py-8 border-t border-slate-100">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center text-slate-500 animate-pulse">
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                      <p>Teacher Diego is listening...</p>
                    </div>
                  ) : !analysis ? (
                    <MicrophoneButton 
                      onTranscription={handleTranscription} 
                      disabled={isSpeaking}
                    />
                  ) : null}
                </div>
              </div>

              {/* Feedback Panel */}
              <AnimatePresence>
                {studentAnswer && analysis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-md overflow-hidden border border-slate-100"
                  >
                    <div className="p-6 md:p-8">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Feedback</h3>
                      
                      <div className="space-y-6">
                        {/* Student's Answer */}
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <p className="text-sm text-slate-500 mb-1">You said:</p>
                          <p className="text-lg font-medium text-slate-700">"{studentAnswer}"</p>
                        </div>
                        
                        {/* Correction */}
                        <div className={`p-4 rounded-2xl flex items-start gap-4 ${analysis.isCorrect ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          <div className={`mt-1 ${analysis.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                            {analysis.isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                          </div>
                          <div>
                            <p className={`text-sm font-bold mb-1 ${analysis.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                              {analysis.isCorrect ? 'Correct!' : 'Correction:'}
                            </p>
                            <p className="text-lg font-medium text-slate-800">
                              {analysis.correction}
                            </p>
                          </div>
                        </div>
                        
                        {/* Tip */}
                        <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-4">
                          <div className="mt-1 text-blue-600">
                            <Lightbulb size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-blue-700 mb-1">Teacher's Tip:</p>
                            <p className="text-slate-700">{analysis.tip}</p>
                          </div>
                        </div>
                        
                        {/* Pronunciation */}
                        {analysis.pronunciationWords && analysis.pronunciationWords.length > 0 && (
                          <div className="bg-amber-50 p-4 rounded-2xl">
                            <p className="text-sm font-bold text-amber-700 mb-2">Practice pronunciation:</p>
                            <div className="flex flex-wrap gap-2">
                              {analysis.pronunciationWords.map((word, i) => (
                                <span key={i} className="px-3 py-1 bg-white border border-amber-200 text-amber-800 rounded-full text-sm font-medium shadow-sm">
                                  {word}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="bg-slate-50 p-4 md:px-8 flex items-center justify-between border-t border-slate-100">
                      <button 
                        onClick={handleRetry}
                        disabled={isSpeaking}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RotateCcw size={18} /> Try Again
                      </button>
                      
                      <button 
                        onClick={handleNextQuestion}
                        disabled={isSpeaking}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-md disabled:opacity-50"
                      >
                        Next Question <ArrowRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
