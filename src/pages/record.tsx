import { useState, useRef, useEffect, useCallback } from "react";
import { BeatsGallery } from "@/components/BeatsGallery";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { signOut } from "aws-amplify/auth";
import { fetchAuthSession } from "aws-amplify/auth";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

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
  const MAX_RECORDING_DURATION = 30; // 30 seconds
  
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
    
    // Smoothly transition gain changes
    if (engine.beatGain && engine.context?.state === 'running') {
      try {
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
      engine.beatPlayer.crossOrigin = 'anonymous'; // This is critical for processing audio from S3
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
        audio: isMobile ? {
          echoCancellation: true, // Enable echo cancellation on mobile
          noiseSuppression: true, // Enable noise suppression on mobile
          autoGainControl: true   // Enable auto gain on mobile
        } : {
          deviceId: selectedAudioInput ? { exact: selectedAudioInput } : undefined,
          echoCancellation: false, // Disable echo cancellation
          noiseSuppression: false, // Disable noise suppression
          autoGainControl: false   // Disable auto gain control
        },
        video: false
      };
      
      console.log('Requesting microphone access with constraints:', constraints);
      try {
        // First check if we're in a secure context
        if (!window.isSecureContext) {
          throw new Error('Microphone access requires a secure context (HTTPS)');
        }
        
        // Check if the browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support audio recording');
        }
        
        const micStream = await navigator.mediaDevices.getUserMedia(constraints);
        engine.micStream = micStream;
        
        // Verify we actually got audio tracks
        if (!micStream || micStream.getAudioTracks().length === 0) {
          throw new Error('No audio track was obtained from your microphone');
        }
        
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
        
        // Provide more user-friendly error messages for common issues
        let errorMessage = `Could not start recording: ${message}`;
        
        if (message.includes('permission') || message.includes('denied') || 
            message.includes('NotAllowedError') || message.includes('not allowed')) {
          errorMessage = 'Microphone access was denied. Please allow microphone permissions when prompted and reload the page.';
          
          // Additional mobile-specific guidance
          if (isMobile) {
            if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
              errorMessage += ' On iOS, make sure your browser has microphone permissions enabled in your device settings.';
            } else if (/Android/.test(navigator.userAgent)) {
              errorMessage += ' On Android, try tapping the lock/info icon in your address bar to update site permissions.';
            }
          }
        } else if (message.includes('secure context') || message.includes('insecure')) {
          errorMessage = 'Recording requires a secure connection (HTTPS). Please access this site using HTTPS.';
        } else if (message.includes('support')) {
          errorMessage = 'Your browser does not fully support audio recording features. Please try using Chrome, Safari, or Firefox.';
        } else if (message.includes('getUserMedia') || message.includes('mediaDevices')) {
          errorMessage = 'Your browser cannot access the microphone. Please ensure you have a microphone connected and try a different browser.';
        }
        
        setRecordingState({
          phase: 'inactive',
          duration: 0,
          audioBlob: null,
          audioUrl: null,
          error: errorMessage
        });
        
        return false;
      }
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
    
    // Check if device has proper permission access first - especially important for iOS
    try {
      // This is a permission "pre-check" to give more specific error messages
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionStatus.state === 'denied') {
          setRecordingState({
            phase: 'inactive',
            duration: 0,
            audioBlob: null,
            audioUrl: null,
            error: 'Microphone access was denied. Please enable microphone permissions in your browser settings and reload the page.'
          });
          return;
        }
      }
    } catch (permErr) {
      console.log('Permission check not supported, continuing with standard flow:', permErr);
    }
    
    // Attempt to start audio context first to address Safari's requirement
    // that audio contexts be created within a user gesture
    try {
      const tempContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await tempContext.resume();
      tempContext.close();
    } catch (audioContextErr) {
      console.error('Could not initialize audio context:', audioContextErr);
      // Continue anyway - the main setup will handle errors
    }
    
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
    if (!recordingState.audioBlob || !selectedBeat) {
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
      // Get the authentication token
      const session = await fetchAuthSession();
      // Try using the ID token instead of the access token
      const token = session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      console.log('Using token for authentication (first 10 chars):', token.substring(0, 10) + '...');
      
      // First, create the recording metadata in the backend
      const response = await fetch('/api/recordings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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

      // Now upload the audio file through our API to avoid CORS issues
      const formData = new FormData();
      formData.append('audioFile', recordingState.audioBlob, 'recording.webm');
      formData.append('presignedUrl', presignedUrl);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
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
        <title>Record a Freestyle - FreestyleFiend</title>
        <meta name="description" content="Record your freestyle over premium beats" />
        <style>{`
          body {
            background-color: #0f0f0f;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          
          a {
            color: inherit;
            text-decoration: none;
          }
          
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Head>
      
      <main style={{ 
        minHeight: 'calc(100vh - 60px)', 
        backgroundColor: '#0f0f0f', 
        color: 'white',
        padding: '2rem 1rem' 
      }}>
        <div style={{ 
          maxWidth: '72rem', // max-w-6xl equivalent
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {successMessage && (
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)', // green with opacity
              color: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              maxWidth: '500px',
              margin: '0 auto 1.5rem'
            }}>
              {successMessage}
            </div>
          )}
          
          {recordingState.error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)', // red with opacity
              color: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              maxWidth: '500px',
              margin: '0 auto 1.5rem'
            }}>
              {recordingState.error}
            </div>
          )}
          
          {/* Removed redundant "Select a Beat" header */}

          {!selectedBeat ? (
            // Step 1: Select a beat
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#9333ea'
              }}>
                Choose a Beat to Freestyle Over
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}>
                Select a beat from our gallery, then record your freestyle over it.
              </p>
              
              {/* Headphones recommendation notice */}
              <div style={{
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                borderRadius: '0.375rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '20px', color: '#9333ea' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>
                  <strong>Pro tip:</strong> For best quality recordings without echo, please use headphones. 
                  This prevents the beat from being recorded twice.
                </p>
              </div>
              <BeatsGallery onSelectBeat={handleSelectBeat} />
            </div>
          ) : (
            // Step 2: Recording interface
            <div style={{
              backgroundColor: 'rgba(17, 17, 17, 0.8)',
              borderRadius: '0.75rem',
              padding: '2rem',
              color: 'white',
              maxWidth: '36rem', // max-w-2xl equivalent
              margin: '0 auto',
              border: '1px solid rgba(147, 51, 234, 0.2)',
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
                  border: '1px solid rgba(147, 51, 234, 0.1)',
                }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    Beat: {beatDetails.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                    by {beatDetails.producer}
                  </p>
                  
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
                        onChange={(e) => setBeatVolume(parseInt(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: '#9333ea',
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
                  border: '1px solid rgba(147, 51, 234, 0.1)',
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
                    gap: '0.5rem'
                  }}>
                    <input
                      id="force-mono"
                      type="checkbox"
                      checked={forceMono}
                      onChange={(e) => setForceMono(e.target.checked)}
                      style={{
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
                        backgroundColor: '#9333ea', // Our purple accent color
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
                    : `Recordings are limited to 30 seconds`}
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
                  
                  <form onSubmit={(e) => {
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
                        Title *
                      </label>
                      <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength={50}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.375rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          color: 'white',
                          fontSize: '1rem'
                        }}
                        placeholder="Give your freestyle a name"
                      />
                    </div>
                    
                    <div style={{ 
                      marginBottom: '1.5rem',
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
                      <label htmlFor="explicit" style={{ fontSize: '0.875rem' }}>
                        Mark as explicit content
                      </label>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        type="submit"
                        disabled={isSubmitting || !title}
                        style={{
                          backgroundColor: '#9333ea',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.375rem',
                          cursor: isSubmitting || !title ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
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
