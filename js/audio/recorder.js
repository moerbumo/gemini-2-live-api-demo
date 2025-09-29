/**
 * Manages audio recording using the MediaRecorder API.
 * Records audio from the user's microphone and outputs it as a single Blob
 * when recording is stopped.
 */
export class AudioRecorder {
    constructor() {
        this.stream = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
    }

    /**
     * Starts recording audio from the specified source type.
     * @param {'mic' | 'display'} sourceType The source of the audio.
     * @returns {Promise<void>} A promise that resolves when recording has started.
     */
    async start(sourceType = 'mic') {
        if (this.isRecording) {
            console.warn('Recording is already in progress.');
            return;
        }

        try {
            if (sourceType === 'mic') {
                this.stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
            } else if (sourceType === 'display') {
                const displayStream =
                    await navigator.mediaDevices.getDisplayMedia({
                        video: true,
                        audio: true,
                    });
                // We only want the audio track.
                const audioTrack = displayStream.getAudioTracks()[0];
                if (!audioTrack) {
                    displayStream.getTracks().forEach((track) => track.stop()); // Stop video track if no audio
                    throw new Error(
                        'No audio track found in the selected display source.',
                    );
                }
                this.stream = new MediaStream([audioTrack]);
                // Also stop the video track when the audio track ends
                audioTrack.onended = () => {
                    displayStream
                        .getVideoTracks()
                        .forEach((track) => track.stop());
                };
            } else {
                throw new Error(`Invalid source type: ${sourceType}`);
            }

            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            console.info('Audio recording started.');
        } catch (error) {
            console.error('Failed to start audio recording:', error);
            throw new Error(
                'Failed to start audio recording: ' + error.message,
            );
        }
    }

    /**
     * Stops the audio recording.
     * @returns {Promise<Blob>} A promise that resolves with the recorded audio Blob.
     */
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.isRecording || !this.mediaRecorder) {
                return reject('Recording has not been started.');
            }

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, {
                    type: 'audio/webm',
                });
                this.stream.getTracks().forEach((track) => track.stop());
                this.isRecording = false;
                console.info(
                    'Audio recording stopped. Blob created.',
                    audioBlob,
                );
                resolve(audioBlob);
            };

            this.mediaRecorder.onerror = (event) => {
                reject('Error during recording: ' + event.error);
            };

            this.mediaRecorder.stop();
        });
    }
}
