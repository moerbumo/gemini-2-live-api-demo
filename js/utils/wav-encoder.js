/**
 * Encodes raw audio data (Int16Array) into a WAV file format Blob.
 *
 * @param {Int16Array} samples - The raw Int16 audio samples.
 * @param {number} numChannels - The number of audio channels (e.g., 1 for mono, 2 for stereo).
 * @param {number} sampleRate - The sample rate of the audio (e.g., 16000, 44100).
 * @returns {Blob} A Blob object representing the WAV file.
 */
export function toWav(samples, numChannels, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');

    // FMT sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
    view.setUint16(32, numChannels * 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // Data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write the PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        view.setInt16(offset, samples[i], true);
    }

    return new Blob([view], { type: 'audio/wav' });
}

/**
 * Helper function to write a string to a DataView.
 * @param {DataView} view - The DataView to write to.
 * @param {number} offset - The offset to start writing at.
 * @param {string} str - The string to write.
 */
function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}
