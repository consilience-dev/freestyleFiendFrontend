import { useState, useRef, useEffect, useCallback } from "react";
import { BeatsGallery } from "@/components/BeatsGallery";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import Head from "next/head";
import { useRouter } from "next/router";

// More specific recording state with well-defined phases
interface RecordingState {
  phase: 'inactive' | 'preparing' | 'recording' | 'processing' | 'ready';
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
}

interface Beat {
  beatId: string;
  title: string;
  producer: string;
  genre?: string;
  bpm?: number;
  duration?: string;
  tags: string[];
  description: string;
  audioUrl: string;
  imageUrl: string;
  s3Key?: string;
  createdAt?: string;
}

interface AudioInputOption {
  deviceId: string;
  label: string;
}

// Separate interface for audio engine state to keep track of internal components
interface AudioEngineState {
  context: AudioContext | null;
  beatPlayer: HTMLAudioElement | null;
  beatSource: MediaElementAudioSourceNode | null;
  micStream: MediaStream | null;
  micSource: MediaStreamAudioSourceNode | null;
  beatGain: GainNode | null;
  micGain: GainNode | null;
  destination: MediaStreamAudioDestinationNode | null;
  recorder: MediaRecorder | null;
  audioChunks: BlobPart[];
}

export default function RecordPage() {
  const { authState } = useAuth();
  const router = useRouter();
  
  // Beat selection and details
  const [selectedBeat, setSelectedBeat] = useState<string | null>(null);
  const [beatDetails, setBeatDetails] = useState<Beat | null>(null);
  
  // Recording state with clear phases
  const [recordingState, setRecordingState] = useState<RecordingState>({
    phase: 'inactive',
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null
  });
  
  // Form fields for saving
  const [title, setTitle] = useState<string>("");
  const [explicit, setExplicit] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Audio settings
  const [audioInputs, setAudioInputs] = useState<AudioInputOption[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('default');
  const [forceMono, setForceMono] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(true);
  const [beatVolume, setBeatVolume] = useState<number>(70); // Default beat volume at 70%
  const [monitorMic, setMonitorMic] = useState<boolean>(false); // Option to hear your own voice

  // References for the audio processing engine - kept in a ref to avoid re-renders
  const audioEngineRef = useRef<AudioEngineState>({
    context: null,
    beatPlayer: null,
    beatSource: null,
    micStream: null,
    micSource: null,
    beatGain: null,
    micGain: null,
    destination: null,
    recorder: null,
    audioChunks: []
  });
  
  // Timer ref stays separate as it's not part of the audio engine itself
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Maximum recording duration in seconds
  const MAX_RECORDING_DURATION = 300; // 5 minutes
  
  // Check if user is on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // Update beat volume when it changes in the UI
  useEffect(() => {
    const engine = audioEngineRef.current;
    if (engine.beatGain && engine.context?.state === 'running') {
      try {
        // Smoothly transition gain changes
        engine.beatGain.gain.linearRampToValueAtTime(
          beatVolume / 100,
          engine.context.currentTime + 0.1 // Ramp over 0.1 seconds
        );
        console.log(`Beat gain updated to ${beatVolume}%`);
      } catch (err) {
        console.error('Error updating beat volume:', err);
      }
    }
  }, [beatVolume]);
  
  // Get available audio input devices
  useEffect(() => {
    const getAudioInputs = async () => {
      try {
        // Request permission to access audio devices
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Get list of audio input devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`,
          }));
        
        setAudioInputs(audioInputDevices);
      } catch (err) {
        console.error('Error getting audio inputs:', err);
        setRecordingState(prev => ({
          ...prev,
          error: 'Could not access microphone devices. Please ensure microphone permissions are granted.'
        }));
      }
    };
    
    if (!isMobile) {
      getAudioInputs();
    }
  }, [isMobile]);
  
  // Fetch beat details when a beat is selected
  useEffect(() => {
    const fetchBeatDetails = async (beatId: string) => {
      try {
        const response = await fetch('/api/beats');
        if (!response.ok) {
          throw new Error('Failed to fetch beats');
        }
        
        const beats: Beat[] = await response.json();
        const selectedBeatDetails = beats.find(beat => beat.beatId === beatId);
        
        if (selectedBeatDetails) {
          setBeatDetails(selectedBeatDetails);
        } else {
          setRecordingState(prev => ({
            ...prev,
            error: 'Selected beat not found'
          }));
        }
      } catch (err) {
        console.error('Error fetching beat details:', err);
        setRecordingState(prev => ({
          ...prev,
          error: 'Failed to load beat details'
        }));
      }
    };
    
    if (selectedBeat) {
      fetchBeatDetails(selectedBeat);
    }
  }, [selectedBeat]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupAudioEngine();
    };
  }, []);
  
  const handleSelectBeat = (beatId: string) => {
    // Clean up any previous audio before switching beats
    if (recordingState.phase !== 'inactive') {
      cleanupAudioEngine();
    }
    setSelectedBeat(beatId);
  };
  
  /**
   * Complete cleanup of all audio components
   */
  const cleanupAudioEngine = useCallback(() => {
    console.log('Cleaning up audio engine');
    const engine = audioEngineRef.current;
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Revoke any blob URLs
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
    }
    
    // Stop MediaRecorder if running
    if (engine.recorder && engine.recorder.state !== 'inactive') {
      try {
        engine.recorder.stop();
      } catch (err) {
        console.error('Error stopping recorder:', err);
      }
    }
    
    // Stop and clear beat player
    if (engine.beatPlayer) {
      try {
        engine.beatPlayer.pause();
        engine.beatPlayer.src = '';
        engine.beatPlayer.load();
      } catch (err) {
        console.error('Error cleaning up beat player:', err);
      }
    }
    
    // Stop microphone stream
    if (engine.micStream) {
      try {
        engine.micStream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('Error stopping microphone tracks:', err);
      }
    }
    
    // Disconnect all nodes
    const nodesToDisconnect = [
      engine.beatSource,
      engine.micSource,
      engine.beatGain,
      engine.micGain,
      engine.destination
    ];
    
    nodesToDisconnect.forEach(node => {
      if (node) {
        try {
          node.disconnect();
        } catch (err) {
          console.warn('Error disconnecting node:', err);
        }
      }
    });
    
    // Close AudioContext
    if (engine.context && engine.context.state !== 'closed') {
      try {
        engine.context.close();
      } catch (err) {
        console.error('Error closing AudioContext:', err);
      }
    }
    
    // Reset all engine references
    audioEngineRef.current = {
      context: null,
      beatPlayer: null,
      beatSource: null,
      micStream: null,
      micSource: null,
      beatGain: null,
      micGain: null,
      destination: null,
      recorder: null,
      audioChunks: []
    };
    
    // Reset recording state
    setRecordingState({
      phase: 'inactive',
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null
    });
    
    console.log('Audio engine cleanup completed');
  }, [recordingState.audioUrl]);
  
  /**
   * Initialize audio context and create/connect audio nodes
   */
  const setupAudioEngine = useCallback(async () => {
    if (!beatDetails) {
      throw new Error('No beat selected');
    }
    
    console.log('Setting up audio engine');
    setRecordingState(prev => ({ ...prev, phase: 'preparing', error: null }));
    
    try {
      const engine = audioEngineRef.current;
      
      // 1. Create AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass({ 
        latencyHint: 'interactive',
        sampleRate: 48000
      });
      engine.context = context;
      
      // Ensure context is running
      if (context.state === 'suspended') {
        await context.resume();
        console.log('AudioContext resumed from suspended state');
      }
      
      // 2. ALWAYS create a new Audio element for each recording session
      // This is crucial to avoid the "already connected" error
      engine.beatPlayer = new Audio();
      engine.beatPlayer.crossOrigin = 'anonymous';
      engine.beatPlayer.preload = 'auto';
      console.log('Created new Audio element for beat playback');
      
      // 3. Set up beat source
      console.log(`Loading beat from URL: ${beatDetails.audioUrl}`);
      engine.beatPlayer.src = beatDetails.audioUrl;
      
      // Wait for beat to be ready
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          engine.beatPlayer.removeEventListener('canplaythrough', onCanPlay);
          engine.beatPlayer.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = (e: Event) => {
          engine.beatPlayer.removeEventListener('canplaythrough', onCanPlay);
          engine.beatPlayer.removeEventListener('error', onError);
          
          const mediaError = engine.beatPlayer.error;
          const errorMsg = mediaError 
            ? `Beat loading error (${mediaError.code}): ${mediaError.message}` 
            : 'Unknown beat loading error';
          
          console.error('Beat loading failed:', errorMsg, e);
          reject(new Error(errorMsg));
        };
        
        engine.beatPlayer.addEventListener('canplaythrough', onCanPlay);
        engine.beatPlayer.addEventListener('error', onError);
        
        // Force load
        engine.beatPlayer.load();
      });
      
      console.log('Beat loaded successfully');
      
      // 4. Create destination for recording
      const destination = context.createMediaStreamDestination();
      engine.destination = destination;
      
      // 5. Create gain nodes for volume control
      const beatGain = context.createGain();
      beatGain.gain.value = beatVolume / 100;
      engine.beatGain = beatGain;
      
      const micGain = context.createGain();
      micGain.gain.value = 1.0; // Full mic volume
      engine.micGain = micGain;
      
      // 6. Connect beat player to context
      const beatSource = context.createMediaElementSource(engine.beatPlayer);
      engine.beatSource = beatSource;
      
      // Connect beat through gain to both recorder and output
      beatSource.connect(beatGain);
      beatGain.connect(destination);
      beatGain.connect(context.destination); // For monitoring the beat
      
      // 7. Set up microphone input
      const constraints: MediaStreamConstraints = {
        audio: isMobile ? true : {
          deviceId: selectedAudioInput ? { exact: selectedAudioInput } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      };
      
      console.log('Requesting microphone access with constraints:', constraints);
      const micStream = await navigator.mediaDevices.getUserMedia(constraints);
      engine.micStream = micStream;
      
      const micSource = context.createMediaStreamSource(micStream);
      engine.micSource = micSource;
      
      // 8. Apply mono conversion if needed and connect microphone
      if (forceMono && !isMobile) {
        // Check if input is actually stereo
        const micTrackSettings = micStream.getAudioTracks()[0].getSettings();
        const channelCount = micTrackSettings.channelCount;
        
        if (channelCount === 2) {
          console.log('Converting stereo mic input to mono');
          const splitter = context.createChannelSplitter(2);
          const merger = context.createChannelMerger(1);
          
          micSource.connect(splitter);
          splitter.connect(merger, 0, 0); // Left -> mono
          splitter.connect(merger, 1, 0); // Right -> mono
          merger.connect(micGain);
        } else {
          console.log('Mic input is already mono, no conversion needed');
          micSource.connect(micGain);
        }
      } else {
        micSource.connect(micGain);
      }
      
      // Connect mic to recorder
      micGain.connect(destination);
      
      // Optionally connect mic to output for monitoring
      if (monitorMic) {
        micGain.connect(context.destination);
        console.log('Microphone monitoring enabled');
      }
      
      // 9. Create MediaRecorder with optimal settings
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4'
      ];
      
      // Find best supported format
      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      if (!mimeType) {
        throw new Error('No supported recording MIME type found');
      }
      
      console.log(`Using recording format: ${mimeType}`);
      
      const recorderOptions = {
        mimeType,
        audioBitsPerSecond: 128000
      };
      
      const recorder = new MediaRecorder(destination.stream, recorderOptions);
      engine.recorder = recorder;
      engine.audioChunks = [];
      
      // Handle data from recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          engine.audioChunks.push(event.data);
        }
      };
      
      // Handle recording completion
      recorder.onstop = () => {
        console.log('Recording stopped, processing audio...');
        setRecordingState(prev => ({ ...prev, phase: 'processing' }));
        
        try {
          const audioBlob = new Blob(engine.audioChunks, { type: mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          console.log(`Recording processed: ${engine.audioChunks.length} chunks, blob size: ${audioBlob.size} bytes`);
          
          // Update state with the recording result
          setRecordingState({
            phase: 'ready',
            duration: recordingState.duration,
            audioBlob,
            audioUrl,
            error: null
          });
        } catch (err) {
          console.error('Error processing recording:', err);
          setRecordingState({
            phase: 'inactive',
            duration: 0,
            audioBlob: null,
            audioUrl: null,
            error: 'Failed to process recording'
          });
        }
      };
      
      // Handle errors
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setRecordingState(prev => ({
          ...prev,
          phase: 'inactive',
          error: 'Recording error occurred'
        }));
      };
      
      console.log('Audio engine setup complete');
      return true;
    } catch (err) {
      // Clean up partial setup on error
      cleanupAudioEngine();
      
      const message = err instanceof Error ? err.message : 'Unknown setup error';
      console.error('Audio engine setup failed:', message);
      
      setRecordingState({
        phase: 'inactive',
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        error: `Could not start recording: ${message}`
      });
      
      return false;
    }
  }, [beatDetails, beatVolume, forceMono, isMobile, monitorMic, selectedAudioInput, cleanupAudioEngine, recordingState.duration]);
  
  /**
   * Start the recording process
   */
  const startRecording = useCallback(async () => {
    console.log('Starting recording process');
    
    // First, clean up any previous recording
    cleanupAudioEngine();
    
    // Set up audio engine from scratch
    const setupSuccess = await setupAudioEngine();
    if (!setupSuccess) return;
    
    const engine = audioEngineRef.current;
    
    try {
      // Start recording
      if (engine.recorder) {
        engine.recorder.start(1000); // Collect in 1-second chunks
        console.log('MediaRecorder started');
      } else {
        throw new Error('Recorder not initialized');
      }
      
      // Play the beat
      if (engine.beatPlayer) {
        // Make sure to reset to beginning
        engine.beatPlayer.currentTime = 0;
        
        // Start playback
        await engine.beatPlayer.play();
        console.log('Beat playback started');
      } else {
        throw new Error('Beat player not initialized');
      }
      
      // Start timer for duration tracking
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingState(prev => ({
          ...prev,
          duration: seconds
        }));
        
        if (seconds >= MAX_RECORDING_DURATION) {
          console.log('Maximum recording duration reached');
          stopRecording();
        }
      }, 1000);
      
      // Update state to recording
      setRecordingState(prev => ({
        ...prev,
        phase: 'recording',
        duration: 0,
        error: null
      }));
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error starting recording process:', message);
      
      setRecordingState({
        phase: 'inactive',
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        error: `Failed to start recording: ${message}`
      });
      
      // Clean up on error
      cleanupAudioEngine();
    }
  }, [cleanupAudioEngine, setupAudioEngine]);
  
  /**
   * Stop the recording process
   */
  const stopRecording = useCallback(() => {
    console.log('Stopping recording');
    const engine = audioEngineRef.current;
    
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop the recorder which will trigger onstop event
    if (engine.recorder && engine.recorder.state !== 'inactive') {
      try {
        engine.recorder.stop();
        console.log('MediaRecorder stopped');
      } catch (err) {
        console.error('Error stopping MediaRecorder:', err);
      }
    }
    
    // Pause beat playback
    if (engine.beatPlayer) {
      engine.beatPlayer.pause();
      console.log('Beat playback paused');
    }
    
    // Don't clean up everything yet, as we need to process the recording
    // The recorder.onstop callback will handle the next steps
  }, []);
  
  /**
   * Discard the current recording and reset
   */
  const discardRecording = useCallback(() => {
    console.log('Discarding recording');
    cleanupAudioEngine();
  }, [cleanupAudioEngine]);
  
  const handleSaveRecording = async () => {
    if (!recordingState.audioBlob || !selectedBeat || !authState.user) {
      setRecordingState(prev => ({
        ...prev,
        error: 'Missing required data to save recording'
      }));
      return;
    }

    if (!title.trim()) {
      setRecordingState(prev => ({
        ...prev,
        error: 'Please enter a title for your freestyle'
      }));
      return;
    }

    setIsSubmitting(true);
    setRecordingState(prev => ({
      ...prev,
      error: null
    }));

    try {
      // First, create the recording metadata in the backend
      const response = await fetch('/api/recordings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beatId: selectedBeat,
          artistName: authState.user.username,
          title: title,
          explicit: explicit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create recording');
      }

      const data = await response.json();
      const { recordingId, presignedUrl } = data;

      console.log(`Uploading recording to presigned URL: ${presignedUrl}`);

      // Now upload the audio file to the presigned URL
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: recordingState.audioBlob,
        headers: {
          'Content-Type': 'audio/webm',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload recording: ${uploadResponse.status}`);
      }

      setSuccessMessage('Your freestyle has been saved successfully! Check it out on the leaderboard.');
      cleanupAudioEngine();
      setTitle('');
      setExplicit(false);
      setSelectedBeat(null);
      
      // Redirect to leaderboard after a short delay
      setTimeout(() => {
        router.push('/leaderboard');
      }, 2000);
    } catch (error) {
      console.error('Error saving recording:', error);
      setRecordingState(prev => ({
        ...prev,
        error: 'Failed to save your recording. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format seconds into MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>{selectedBeat ? "Record Your Freestyle" : "Select a Beat"} - FreestyleFiend</title>
        <meta name="description" content="Record your freestyle rap over beats" />
      </Head>
      
      <main style={{ 
        minHeight: '100vh', 
        backgroundColor: '#4c1d95' // purple-900 equivalent
      }}>
        <div style={{ 
          maxWidth: '72rem', // max-w-6xl equivalent
          margin: '0 auto',
          padding: '2.5rem 1rem'
        }}>
          {successMessage && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.2)', // green with opacity
              color: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {successMessage}
            </div>
          )}
          
          {recordingState.error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)', // red with opacity
              color: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {recordingState.error}
            </div>
          )}
          
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            {selectedBeat ? "Record Your Freestyle" : "Select a Beat"}
          </h1>
          
          {!selectedBeat ? (
            // Step 1: Select a beat
            <BeatsGallery onSelectBeat={handleSelectBeat} />
          ) : (
            // Step 2: Recording interface
            <div style={{
              backgroundColor: 'rgba(107, 33, 168, 0.5)', // purple-800 with opacity
              borderRadius: '1rem',
              padding: '2rem',
              color: 'white',
              maxWidth: '36rem', // max-w-2xl equivalent
              margin: '0 auto',
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>Recording Studio</h2>
              
              {/* Beat info */}
              {beatDetails && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    Beat: {beatDetails.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                    by {beatDetails.producer}
                  </p>
                  
                  {/* Hidden element removed - we now create Audio element in code */}
                  {/* <audio 
                    ref={beatPlayerElementRef}
                    preload="auto"
                    crossOrigin="anonymous"
                    style={{ display: 'none' }}
                  /> */}
                  
                  {/* Beat volume control */}
                  <div style={{ width: '100%', marginTop: '0.75rem' }}>
                    <label 
                      htmlFor="beat-volume-control"
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontSize: '0.75rem',
                        opacity: 0.8
                      }}
                    >
                      Beat Volume: {beatVolume}%
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        id="beat-volume-control"
                        type="range"
                        min="0"
                        max="100"
                        value={beatVolume}
                        // FIX: Directly set state, useEffect handles gain node update
                        onChange={(e) => setBeatVolume(parseInt(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: '#db2777',
                        }}
                      />
                    </div>
                  </div>
                  
                  <p style={{ 
                    fontSize: '0.75rem',
                    marginTop: '0.75rem',
                    textAlign: 'center',
                    color: '#4ade80'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>✓</span> Beat and vocals will be properly mixed in the recording
                  </p>
                </div>
              )}
              
              {/* Audio input selection (desktop only) */}
              {!isMobile && (
                <div style={{
                  marginBottom: '1.5rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                }}>
                  <h3 style={{ 
                    fontWeight: 600, 
                    marginBottom: '0.75rem',
                    fontSize: '0.875rem'
                  }}>
                    Audio Settings
                  </h3>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label 
                      htmlFor="mic-select"
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontSize: '0.75rem',
                        opacity: 0.8
                      }}
                    >
                      Microphone
                    </label>
                    <select
                      id="mic-select"
                      value={selectedAudioInput}
                      onChange={(e) => setSelectedAudioInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.25rem',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="default">Default Microphone</option>
                      {audioInputs.map(input => (
                        <option key={input.deviceId} value={input.deviceId}>
                          {input.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <input
                      id="force-mono"
                      type="checkbox"
                      checked={forceMono}
                      onChange={(e) => setForceMono(e.target.checked)}
                      style={{
                        marginRight: '0.5rem',
                        width: '1.25rem',
                        height: '1.25rem'
                      }}
                    />
                    <label htmlFor="force-mono" style={{ fontSize: '0.875rem' }}>
                      Force Mono (recommended for audio interfaces)
                    </label>
                  </div>
                  
                  <p style={{ 
                    fontSize: '0.75rem', 
                    opacity: 0.7, 
                    marginTop: '0.5rem' 
                  }}>
                    Mono recording ensures your vocals come out of both left and right channels.
                  </p>
                </div>
              )}
              
              {/* Recording timer and controls */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  marginBottom: '1.5rem',
                  fontFamily: 'monospace'
                }}>
                  {formatDuration(recordingState.duration)} / {formatDuration(MAX_RECORDING_DURATION)}
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  {recordingState.phase !== 'recording' ? (
                    // Show Record Button
                    <button
                      onClick={startRecording}
                      disabled={!beatDetails || recordingState.phase === 'preparing' || recordingState.phase === 'processing'}
                      style={{
                        backgroundColor: '#db2777', // pink-600
                        color: 'white',
                        border: 'none',
                        borderRadius: '9999px', // rounded-full
                        width: '3.5rem', // w-14
                        height: '3.5rem', // h-14
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: !beatDetails ? 'not-allowed' : 'pointer',
                        opacity: !beatDetails ? 0.7 : 1,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // shadow-md
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  ) : (
                    // Show Stop Button when recording
                    <button
                      onClick={stopRecording}
                      style={{
                        backgroundColor: '#ef4444', // red-500
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        width: '4rem', // w-16
                        height: '4rem', // h-16
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="6" y="6" width="12" height="12" fill="white" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Recording limit notice */}
                <p style={{ 
                  fontSize: '0.875rem', 
                  opacity: 0.8, 
                  marginBottom: '1rem', 
                  textAlign: 'center' 
                }}>
                  {recordingState.phase === 'recording' 
                    ? `Recording will automatically stop in ${MAX_RECORDING_DURATION - recordingState.duration} seconds` 
                    : `Recordings are limited to ${MAX_RECORDING_DURATION} seconds`}
                </p>
                
                {/* Audio player for preview */}
                {recordingState.audioUrl && (
                  <div style={{ width: '100%', marginBottom: '1.5rem' }}>
                    <audio 
                      src={recordingState.audioUrl} 
                      controls 
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
              
              {/* Recording form - only show when we have a recording */}
              {recordingState.phase === 'ready' && (
                <div style={{ width: '100%' }}>
                  <h3 style={{
                    fontSize: '1.25rem', // text-xl
                    fontWeight: 600,
                    textAlign: 'center',
                    marginBottom: '1.5rem' // mb-6
                  }}>
                    Save Your Freestyle
                  </h3>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveRecording();
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem'
                    }}
                  >
                    <div>
                      <label 
                        htmlFor="title"
                        style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          fontSize: '0.875rem',
                          color: 'rgba(255, 255, 255, 0.8)'
                        }}
                      >
                        Title
                      </label>
                      <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '1rem'
                        }}
                        placeholder="Name your freestyle"
                      />
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <input
                        id="explicit"
                        type="checkbox"
                        checked={explicit}
                        onChange={(e) => setExplicit(e.target.checked)}
                        style={{
                          width: '1.25rem',
                          height: '1.25rem'
                        }}
                      />
                      <label htmlFor="explicit">
                        Contains explicit content
                      </label>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      marginTop: '1rem'
                    }}>
                      <button
                        type="button"
                        onClick={discardRecording}
                        style={{
                          flex: '1',
                          padding: '0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 500
                        }}
                      >
                        Discard
                      </button>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          flex: '1',
                          padding: '0.75rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          backgroundColor: '#db2777', // pink-600
                          color: 'white',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          opacity: isSubmitting ? 0.7 : 1
                        }}
                      >
                        {isSubmitting ? 'Saving...' : 'Save Freestyle'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Back button */}
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                  onClick={() => setSelectedBeat(null)}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    textDecoration: 'underline'
                  }}
                >
                  ← Back to Beat Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
