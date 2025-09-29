import { toWav } from '../utils/wav-encoder.js';

/**
 * Manages audio recording and processing using a dedicated AudioWorklet.
 * This class is responsible for:
 * - Acquiring audio streams from microphone or display.
 * - Loading and managing the 'intelligent-slicer' AudioWorklet.
 * - Receiving audio chunks from the worklet.
 * - Converting the raw Int16 audio data into a WAV file Blob.
 * - Emitting events when a new audio chunk is ready for processing.
 */
export class AudioRecorder extends EventTarget {
    constructor() {
        super();
        this.audioContext = null;
        this.stream = null;
        this.workletNode = null;
        this.isRecording = false;
    }

    /**
     * Starts the audio recording and processing pipeline.
     * @param {'mic' | 'display'} sourceType - The source of the audio.
     */
    async start(sourceType = 'mic') {
        if (this.isRecording) {
            console.warn('Recording is already in progress.');
            return;
        }

        try {
            // 1. Get Audio Stream
            this.stream = await this._getAudioStream(sourceType);

            // 2. Setup Audio Context and Worklet
            if (!this.audioContext) {
                this.audioContext = new AudioContext({
                    sampleRate: 16000, // Set target sample rate
                });
            }
            // Resume context if it's suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            await this.audioContext.audioWorklet.addModule(
                'js/audio/worklets/intelligent-slicer.js'
            );

            // 3. Create Audio Pipeline
            const source = this.audioContext.createMediaStreamSource(this.stream);
            this.workletNode = new AudioWorkletNode(
                this.audioContext,
                'intelligent-slicer-processor'
            );

            // Connect the source to the worklet node.
            source.connect(this.workletNode);
            // Note: We don't connect to the destination, as we only want to process the audio, not play it.

            // 4. Listen for messages from the Worklet
            this.workletNode.port.onmessage = (event) => {
                if (event.data.event === 'audioChunk') {
                    this._handleAudioChunk(event.data.data);
                } else if (event.data.event === 'debug') {
                    console.log('Worklet Debug:', event.data.message);
                }
            };

            this.isRecording = true;
            console.info(`Audio recording started from ${sourceType}.`);
        } catch (error) {
            console.error('Failed to start audio recording:', error);
            this.stop(); // Clean up any resources
            throw new Error('Failed to start audio recording: ' + error.message);
        }
    }

    /**
     * Stops the audio recording and cleans up all resources.
     */
    stop() {
        if (!this.isRecording && !this.stream) {
            return;
        }

        // Send a stop command to the worklet to flush any remaining audio data.
        if (this.workletNode) {
            this.workletNode.port.postMessage({ command: 'stop' });
        }

        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }

        if (this.workletNode) {
            // We delay the disconnection to allow the final message to be processed.
            setTimeout(() => {
                this.workletNode.port.onmessage = null;
                this.workletNode.disconnect();
                this.workletNode = null;
            }, 500);
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            // Don't close the context immediately to allow any pending operations to finish.
            // It can be reused for the next recording session.
        }

        this.isRecording = false;
        console.info('Audio recording stopped.');
    }

    /**
     * Handles the 'audioChunk' message from the worklet.
     * Converts the Int16Array data to a WAV Blob and dispatches an event.
     * @param {Int16Array} int16Array - The raw audio data from the worklet.
     */
    _handleAudioChunk(int16Array) {
        const wavBlob = toWav(int16Array, 1, this.audioContext.sampleRate);
        this.dispatchEvent(
            new CustomEvent('audioChunkReady', { detail: wavBlob })
        );
    }

    /**
     * Acquires the appropriate audio stream based on the source type.
     * @param {'mic' | 'display'} sourceType - The desired audio source.
     * @returns {Promise<MediaStream>} A promise that resolves with the audio MediaStream.
     */
    async _getAudioStream(sourceType) {
        switch (sourceType) {
            case 'mic':
                return navigator.mediaDevices.getUserMedia({
                    audio: {
                        sampleRate: 16000, // Request a specific sample rate
                        noiseSuppression: true,
                        echoCancellation: true,
                    },
                });
            case 'display':
                const displayStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true,
                });
                const audioTrack = displayStream.getAudioTracks()[0];
                if (!audioTrack) {
                    displayStream.getTracks().forEach((track) => track.stop());
                    throw new Error('No audio track found in the selected display source.');
                }
                // When the audio track ends (e.g., user stops sharing), stop the video track too.
                audioTrack.onended = () => {
                    displayStream.getVideoTracks().forEach((track) => track.stop());
                };
                return new MediaStream([audioTrack]);
            default:
                throw new Error(`Invalid source type: ${sourceType}`);
        }
    }
}
