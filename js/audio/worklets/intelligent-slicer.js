/**
 * @class IntelligentSlicerProcessor
 * @extends AudioWorkletProcessor
 *
 * This AudioWorklet processor performs several key tasks for real-time audio processing:
 * 1.  **Volume Calculation**: It continuously calculates the Root Mean Square (RMS) of the incoming audio to measure its volume.
 * 2.  **Silence Detection**: Based on the calculated volume, it detects periods of silence in the audio stream.
 * 3.  **Audio Buffering & Slicing**: It buffers audio data during periods of speech and, upon detecting a sufficient period of silence, slices the buffered audio into a complete chunk.
 * 4.  **Format Conversion**: It converts the standard Float32 audio samples into Int16 format, which is more efficient for network transmission and preferred by many speech recognition APIs.
 * 5.  **Chunk Transmission**: It sends the complete Int16 audio chunk back to the main thread for further processing (e.g., sending to an API).
 */
class IntelligentSlicerProcessor extends AudioWorkletProcessor {
    // --- Configuration ---
    SILENCE_THRESHOLD = 0.01; // Volume threshold for silence detection.
    SILENCE_DURATION_SEC = 1.67; // Silence duration to trigger a slice.
    MAX_RECORDING_SEC = 180; // 3 minutes max recording time for a single chunk.

    // --- State ---
    _audioBuffer; // Dynamically allocated buffer.
    _bufferWriteIndex = 0;
    _totalFramesProcessed = 0;

    _silenceFramesCount = 0;
    _speechFramesCount = 0;
    _isSpeaking = false;

    _requiredSilenceFrames;
    _maxFrames;

    constructor() {
        super();
        // We process audio in chunks of 128 frames.
        const framesPerSecond = sampleRate / 128;
        this._requiredSilenceFrames = Math.ceil(this.SILENCE_DURATION_SEC * framesPerSecond);
        this._maxFrames = Math.ceil(this.MAX_RECORDING_SEC * framesPerSecond);

        // Allocate a buffer large enough to hold the maximum recording duration.
        this._audioBuffer = new Int16Array(sampleRate * this.MAX_RECORDING_SEC);

        this.port.onmessage = (event) => {
            if (event.data.command === 'stop') {
                this.sendAndClearBuffer();
            }
        };

        this.port.postMessage({ event: 'debug', message: `Slicer configured: Silence Frames=${this._requiredSilenceFrames}, Max Frames=${this._maxFrames}` });
    }

    /**
     * The main processing function, called repeatedly by the audio engine.
     * @param {Float32Array[][]} inputs - The input audio data.
     * @returns {boolean} - Return true to keep the processor alive.
     */
    process(inputs) {
        // Use the first input and first channel.
        const inputChannel = inputs[0][0];

        // If there's no input data, do nothing.
        if (!inputChannel) {
            return true;
        }

        // --- 1. Volume Calculation ---
        let sum = 0;
        for (let i = 0; i < inputChannel.length; i++) {
            sum += inputChannel[i] * inputChannel[i];
        }
        const rms = Math.sqrt(sum / inputChannel.length);

        // --- 2. Silence Detection & State Management ---
        if (rms > this.SILENCE_THRESHOLD) {
            // Speech detected
            this._isSpeaking = true;
            this._silenceFramesCount = 0;
            this._speechFramesCount++;
        } else {
            // Silence detected
            if (this._isSpeaking) {
                this._silenceFramesCount++;
            }
        }

        // --- 3. Audio Buffering ---
        if (this._isSpeaking) {
            // Convert Float32 to Int16 and add to buffer.
            for (let i = 0; i < inputChannel.length; i++) {
                if (this._bufferWriteIndex < this._audioBuffer.length) {
                    const int16Value = Math.max(
                        -32768,
                        Math.min(32767, Math.floor(inputChannel[i] * 32768))
                    );
                    this._audioBuffer[this._bufferWriteIndex++] = int16Value;
                }
            }
        }

        this._totalFramesProcessed++;

        // --- 4. Slicing and Transmission ---
        const shouldSliceOnSilence = this._isSpeaking && this._silenceFramesCount >= this._requiredSilenceFrames;
        const shouldSliceOnMaxTime = this._isSpeaking && this._totalFramesProcessed >= this._maxFrames;

        if (shouldSliceOnSilence || shouldSliceOnMaxTime) {
            this.sendAndClearBuffer();
        }

        return true;
    }

    /**
     * Sends the accumulated audio buffer to the main thread and resets the state.
     */
    sendAndClearBuffer() {
        if (this._bufferWriteIndex > 0) {
            this.port.postMessage({
                event: 'audioChunk',
                // Send a copy of the relevant part of the buffer.
                data: this._audioBuffer.slice(0, this._bufferWriteIndex),
            });
        }

        // Reset state for the next utterance.
        this._bufferWriteIndex = 0;
        this._silenceFramesCount = 0;
        this._speechFramesCount = 0;
        this._isSpeaking = false;
        this._totalFramesProcessed = 0;
    }
}

registerProcessor('intelligent-slicer-processor', IntelligentSlicerProcessor);
