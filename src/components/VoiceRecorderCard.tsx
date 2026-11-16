import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  Send,
  Volume2,
  Globe,
  Loader2,
  Wand2,
} from 'lucide-react';
import {
  LANGUAGE_OPTIONS,
  SAMPLE_VOICE_PHRASES,
} from '../data/initialData';
import type { LanguageCode, SampleVoicePhrase } from '../types';
import type { UIStrings } from '../i18n/translations';

interface VoiceRecorderCardProps {
  selectedLanguage: LanguageCode;
  strings: UIStrings;
  onLanguageChange: (lang: LanguageCode) => void;
  onProcessSpokenText: (
    text: string,
    audioBlob?: Blob | null,
    speechErrorCode?: string
  ) => Promise<void>;
  isProcessing: boolean;
  hasGeminiKey: boolean;
  onOpenSettings: () => void;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResult;
  };
}

interface WebSpeechRecognitionInstance {
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionConstructor():
  | (new () => WebSpeechRecognitionInstance)
  | null {
  const ctor =
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  return (ctor as (new () => WebSpeechRecognitionInstance) | undefined) ?? null;
}

function describeSpeechError(
  code: string | undefined,
  lang: LanguageCode,
  hasGeminiKey: boolean
): string {
  const isMl = lang === 'ml-IN';
  switch (code) {
    case 'not-allowed':
    case 'permission-denied':
      return isMl
        ? 'മൈക്രോഫോൺ അനുമതി ലഭിച്ചില്ല. ബ്രൗസർ ക്രമീകരണത്തിൽ മൈക്ക് അനുവദിക്കുക.'
        : 'Microphone permission denied. Please allow mic access in browser settings.';
    case 'network':
      return isMl
        ? hasGeminiKey
          ? 'Gemini AI വഴി ശബ്ദം തിരിച്ചറിയുന്നു.'
          : 'ഈ ബ്രൗസറിൽ നേരിട്ടുള്ള വോയ്സ് സർവീസ് ലഭ്യമല്ല. Gemini API Key ചേർക്കുകയോ Chrome ഉപയോഗിക്കുകയോ ചെയ്യുക.'
        : hasGeminiKey
        ? 'Processing audio with Gemini AI.'
        : 'Browser speech service is unavailable here. Add a Gemini API Key in Settings or use Chrome.';
    case 'language-not-supported':
    case 'service-not-allowed':
      return isMl
        ? 'ഈ ബ്രൗസറിൽ മലയാളം ഡിക്ടേഷൻ ലഭ്യമല്ല. AI ക്രമീകരണത്തിൽ Gemini API Key ചേർക്കുക.'
        : 'Speech dictation for this language is not enabled in this browser. Add a Gemini API Key in Settings.';
    case 'audio-capture':
      return isMl
        ? 'മൈക്രോഫോൺ കണ്ടെത്താനായില്ല.'
        : 'No microphone hardware detected.';
    case 'no-speech':
      return isMl
        ? 'ശബ്ദം ഒന്നും കേട്ടില്ല. ദയവായി വീണ്ടും സംസാരിക്കുക.'
        : 'No speech detected. Please tap the mic and speak clearly.';
    default:
      return isMl
        ? 'ശബ്ദം തിരിച്ചറിയാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.'
        : 'Could not recognize speech. Please try again.';
  }
}

export const VoiceRecorderCard: React.FC<VoiceRecorderCardProps> = ({
  selectedLanguage,
  strings,
  onLanguageChange,
  onProcessSpokenText,
  isProcessing,
  hasGeminiKey,
  onOpenSettings,
}) => {
  const baseId = useId();
  const [isListening, setIsListening] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'speech' | 'audio'>('speech');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [voiceStatusMessage, setVoiceStatusMessage] = useState<string>('');

  const recognitionRef = useRef<WebSpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const lastCompositionEndAtRef = useRef<number | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const latestInterimRef = useRef<string>('');
  const lastSpeechErrorRef = useRef<string | undefined>(undefined);
  const retriedFallbackLangRef = useRef<boolean>(false);
  const finalizedRef = useRef<boolean>(false);

  const currentLangOption =
    LANGUAGE_OPTIONS.find((l) => l.code === selectedLanguage) || LANGUAGE_OPTIONS[0];

  const cleanupMediaAndTimers = () => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupMediaAndTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const startAudioRecorderFallback = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsListening(false);
      setVoiceStatusMessage(
        describeSpeechError(lastSpeechErrorRef.current, selectedLanguage, hasGeminiKey)
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      setRecordingMode('audio');
      setIsListening(true);
      setRecordingSeconds(0);

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob =
          audioChunksRef.current.length > 0
            ? new Blob(audioChunksRef.current, { type: mimeType })
            : null;
        cleanupMediaAndTimers();
        setIsListening(false);

        if (blob && blob.size > 0) {
          setVoiceStatusMessage('');
          void onProcessSpokenText('', blob, lastSpeechErrorRef.current || 'unsupported');
        } else {
          setVoiceStatusMessage(
            describeSpeechError(lastSpeechErrorRef.current, selectedLanguage, hasGeminiKey)
          );
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setIsListening(false);
      cleanupMediaAndTimers();
      const domErr = err as DOMException;
      if (domErr?.name === 'NotAllowedError' || domErr?.name === 'PermissionDeniedError') {
        setVoiceStatusMessage(describeSpeechError('not-allowed', selectedLanguage, hasGeminiKey));
      } else {
        setVoiceStatusMessage(describeSpeechError('audio-capture', selectedLanguage, hasGeminiKey));
      }
    }
  };

  const startWebSpeechCapture = (langToUse: string) => {
    const SpeechRecConstructor = getSpeechRecognitionConstructor();
    if (!SpeechRecConstructor) {
      lastSpeechErrorRef.current = 'no-speech-api';
      void startAudioRecorderFallback();
      return;
    }

    try {
      const recognition = new SpeechRecConstructor();
      recognition.lang = langToUse;
      recognition.continuous = false;
      recognition.interimResults = true;
      setRecordingMode('speech');

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (recognitionRef.current !== recognition) return;
        let interim = '';
        let finalPart = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const res = event.results[i];
          if (res.isFinal) {
            finalPart += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        if (finalPart) {
          accumulatedTranscriptRef.current = `${accumulatedTranscriptRef.current} ${finalPart}`.trim();
        }
        latestInterimRef.current = interim;
        const combined = `${accumulatedTranscriptRef.current} ${interim}`.trim();
        setLiveTranscript(combined);
      };

      recognition.onerror = (err) => {
        if (recognitionRef.current !== recognition) return;
        lastSpeechErrorRef.current = err.error;

        if (
          (err.error === 'language-not-supported' || err.error === 'service-not-allowed') &&
          !retriedFallbackLangRef.current &&
          langToUse !== 'en-IN'
        ) {
          retriedFallbackLangRef.current = true;
          recognitionRef.current = null;
          try {
            recognition.abort();
          } catch {
            // ignore
          }
          startWebSpeechCapture('en-IN');
          return;
        }

        if (
          err.error === 'network' ||
          err.error === 'language-not-supported' ||
          err.error === 'service-not-allowed'
        ) {
          finalizedRef.current = true;
          recognitionRef.current = null;
          try {
            recognition.abort();
          } catch {
            // ignore
          }
          void startAudioRecorderFallback();
          return;
        }

        finalizedRef.current = true;
        setIsListening(false);
        cleanupMediaAndTimers();
        setVoiceStatusMessage(describeSpeechError(err.error, selectedLanguage, hasGeminiKey));
      };

      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;
        if (finalizedRef.current) return;
        finalizedRef.current = true;
        setIsListening(false);
        cleanupMediaAndTimers();

        const captured = (accumulatedTranscriptRef.current || latestInterimRef.current).trim();
        if (captured) {
          setManualText(captured);
          setVoiceStatusMessage('');
          void onProcessSpokenText(captured, null);
        } else if (lastSpeechErrorRef.current) {
          setVoiceStatusMessage(
            describeSpeechError(lastSpeechErrorRef.current, selectedLanguage, hasGeminiKey)
          );
        } else {
          setVoiceStatusMessage(describeSpeechError('no-speech', selectedLanguage, hasGeminiKey));
        }
      };

      cleanupMediaAndTimers();
      finalizedRef.current = false;
      recognitionRef.current = recognition;
      setIsListening(true);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      recognition.start();
    } catch {
      void startAudioRecorderFallback();
    }
  };

  const startVoiceCapture = async () => {
    setVoiceStatusMessage('');
    setLiveTranscript('');
    setRecordingSeconds(0);
    accumulatedTranscriptRef.current = '';
    latestInterimRef.current = '';
    lastSpeechErrorRef.current = undefined;
    retriedFallbackLangRef.current = false;
    finalizedRef.current = false;

    if (hasGeminiKey) {
      await startAudioRecorderFallback();
      return;
    }

    startWebSpeechCapture(selectedLanguage);
  };

  const stopVoiceCapture = () => {
    if (recordingMode === 'audio' && mediaRecorderRef.current?.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        cleanupMediaAndTimers();
        setIsListening(false);
      }
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        cleanupMediaAndTimers();
        setIsListening(false);
      }
    } else {
      cleanupMediaAndTimers();
      setIsListening(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = manualText.trim();
    if (!trimmed || isProcessing) return;
    await onProcessSpokenText(trimmed);
  };

  // IME-safe Enter-to-Submit handler per modern-web-guidance `ime-safe-enter-submit`
  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
        return;
      }

      if (
        lastCompositionEndAtRef.current !== null &&
        Math.abs(event.timeStamp - lastCompositionEndAtRef.current) < 50
      ) {
        return;
      }

      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleSamplePhraseClick = async (phrase: SampleVoicePhrase) => {
    const textToUse =
      selectedLanguage === 'ml-IN' ? phrase.malayalamText : phrase.englishMeaning;
    setManualText(textToUse);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(textToUse);
      u.lang = selectedLanguage;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
    await onProcessSpokenText(textToUse);
  };

  const formattedTimer = `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(
    recordingSeconds % 60
  ).padStart(2, '0')}`;

  return (
    <section className="voice-studio-card" aria-labelledby={`${baseId}-heading`}>
      <div className="voice-studio-top">
        <div className="lang-selector-wrap">
          <label htmlFor={`${baseId}-lang`} className="lang-label">
            <Globe size={15} />
            <span>{strings.languageLabel}:</span>
          </label>
          <select
            id={`${baseId}-lang`}
            name="language"
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
            className="lang-select"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.nativeName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={`ai-status-pill ${hasGeminiKey ? 'ai-connected' : ''}`}
          onClick={onOpenSettings}
        >
          <Sparkles size={14} />
          <span>{hasGeminiKey ? strings.geminiActive : strings.aiSetup}</span>
        </button>
      </div>

      <div className="voice-hero-center">
        <h2 id={`${baseId}-heading`} className="voice-hero-title">
          {strings.voiceHeroTitle}
        </h2>
        <p className="voice-hero-subtitle">{strings.voiceHeroSubtitle}</p>

        <div className="mic-orb-container">
          <button
            type="button"
            className={`mic-orb-button ${isListening ? 'listening' : ''} ${
              isProcessing ? 'processing' : ''
            }`}
            onClick={isListening ? stopVoiceCapture : startVoiceCapture}
            disabled={isProcessing}
            aria-pressed={isListening}
            aria-label={isListening ? strings.recordingAudioText : strings.tapMicToSpeak}
          >
            {isProcessing ? (
              <Loader2 size={34} className="spin-icon" />
            ) : isListening ? (
              <Square size={28} fill="currentColor" />
            ) : (
              <Mic size={34} />
            )}
          </button>
          <span className="mic-caption">
            {isProcessing
              ? strings.extractingText
              : isListening
              ? `${
                  recordingMode === 'audio' ? strings.recordingAudioText : strings.listeningText
                } (${formattedTimer})`
              : strings.tapMicToSpeak}
          </span>
        </div>

        {isListening && liveTranscript && (
          <div className="live-transcript-banner" role="status" aria-live="polite">
            <span className="pulse-dot" />
            <p>“{liveTranscript}”</p>
          </div>
        )}

        {voiceStatusMessage && (
          <div className="voice-status-notice" role="status">
            {voiceStatusMessage}
          </div>
        )}

        <p className="example-hint-text">{currentLangOption.exampleHint}</p>
      </div>

      <form className="voice-text-form" onSubmit={handleManualSubmit}>
        <label htmlFor={`${baseId}-voice-input`} className="form-label">
          {strings.typeCommandLabel}
        </label>
        <div className="voice-input-row">
          <textarea
            id={`${baseId}-voice-input`}
            name="spokenCommand"
            rows={2}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onCompositionEnd={(e) => {
              lastCompositionEndAtRef.current = e.timeStamp;
            }}
            onKeyDown={handleTextareaKeyDown}
            placeholder={strings.commandPlaceholder}
            className="voice-textarea"
            enterKeyHint="send"
          />
          <button
            type="submit"
            className="voice-send-btn"
            disabled={!manualText.trim() || isProcessing}
          >
            <Send size={18} />
            <span>{strings.verifyBtn}</span>
          </button>
        </div>
      </form>

      <div className="sample-phrases-section">
        <div className="sample-phrases-header">
          <Wand2 size={15} />
          <span>{strings.samplesHeading}</span>
        </div>
        <div className="sample-phrases-list">
          {SAMPLE_VOICE_PHRASES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              className="sample-phrase-chip"
              onClick={() => handleSamplePhraseClick(sample)}
              disabled={isProcessing}
            >
              <div className="sample-chip-top">
                <span className="sample-tag">{sample.tag}</span>
                <Volume2 size={14} className="sample-speaker-icon" />
              </div>
              <p className="sample-mal-text">
                “{selectedLanguage === 'ml-IN' ? sample.malayalamText : sample.englishMeaning}”
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
