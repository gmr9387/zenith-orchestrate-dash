import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { createStorageManager } from './storage.js';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

class VideoProcessor {
  constructor(config = {}) {
    this.config = {
      outputDir: config.outputDir || 'server/processed-videos',
      thumbnailDir: config.thumbnailDir || 'server/thumbnails',
      maxFileSize: config.maxFileSize || 500 * 1024 * 1024, // 500MB
      supportedFormats: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'],
      qualityPresets: {
        '1080p': { width: 1920, height: 1080, bitrate: '5000k' },
        '720p': { width: 1280, height: 720, bitrate: '2500k' },
        '480p': { width: 854, height: 480, bitrate: '1000k' },
        '360p': { width: 640, height: 360, bitrate: '500k' }
      },
      ...config
    };

    // Ensure directories exist
    fs.mkdirSync(this.config.outputDir, { recursive: true });
    fs.mkdirSync(this.config.thumbnailDir, { recursive: true });

    this.storage = config.storage || null;
  }

  // Get video metadata
  async getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        resolve({
          duration: metadata.format.duration,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
          format: metadata.format.format_name,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: eval(videoStream.r_frame_rate),
            bitrate: videoStream.bit_rate
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            channels: audioStream.channels,
            sampleRate: audioStream.sample_rate
          } : null
        });
      });
    });
  }

  // Generate thumbnail
  async generateThumbnail(inputPath, outputPath, time = '00:00:05') {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: [time],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '640x360'
        })
        .on('end', () => resolve(outputPath))
        .on('error', reject);
    });
  }

  // Transcode video to different qualities
  async transcodeVideo(inputPath, outputPath, quality) {
    const preset = this.config.qualityPresets[quality];
    if (!preset) {
      throw new Error(`Unknown quality preset: ${quality}`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(`${preset.width}x${preset.height}`)
        .videoBitrate(preset.bitrate)
        .audioChannels(2)
        .audioFrequency(44100)
        .outputOptions([
          '-preset', 'medium',
          '-crf', '23',
          '-movflags', '+faststart'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .on('progress', (progress) => {
          console.log(`Processing ${quality}: ${Math.round(progress.percent)}%`);
        });
    });
  }

  // Process video with all features
  async processVideo(inputPath, options = {}) {
    const {
      generateThumbnails = true,
      qualities = ['720p', '480p'],
      uploadToStorage = false,
      metadata = {}
    } = options;

    const videoId = nanoid();
    const results = {
      id: videoId,
      original: inputPath,
      processed: {},
      thumbnails: [],
      metadata: null,
      processingTime: 0
    };

    const startTime = Date.now();

    try {
      // Get video metadata
      console.log('Extracting video metadata...');
      results.metadata = await this.getVideoMetadata(inputPath);

      // Generate thumbnails
      if (generateThumbnails) {
        console.log('Generating thumbnails...');
        const thumbnailTimes = ['00:00:05', '00:00:30', '00:01:00'];
        
        for (const time of thumbnailTimes) {
          const thumbnailPath = path.join(
            this.config.thumbnailDir,
            `${videoId}-${time.replace(/:/g, '-')}.jpg`
          );
          
          try {
            await this.generateThumbnail(inputPath, thumbnailPath, time);
            results.thumbnails.push({
              path: thumbnailPath,
              time: time,
              url: uploadToStorage ? await this.uploadToStorage(thumbnailPath, 'thumbnails') : null
            });
          } catch (error) {
            console.warn(`Failed to generate thumbnail at ${time}:`, error.message);
          }
        }
      }

      // Transcode to different qualities
      console.log('Transcoding video...');
      for (const quality of qualities) {
        const outputPath = path.join(
          this.config.outputDir,
          `${videoId}-${quality}.mp4`
        );

        try {
          await this.transcodeVideo(inputPath, outputPath, quality);
          results.processed[quality] = {
            path: outputPath,
            url: uploadToStorage ? await this.uploadToStorage(outputPath, 'videos') : null
          };
        } catch (error) {
          console.error(`Failed to transcode ${quality}:`, error.message);
        }
      }

      results.processingTime = Date.now() - startTime;
      console.log(`Video processing completed in ${results.processingTime}ms`);

      return results;
    } catch (error) {
      console.error('Video processing failed:', error);
      throw error;
    }
  }

  // Upload to storage (if configured)
  async uploadToStorage(filePath, folder) {
    if (!this.storage) {
      return null;
    }

    try {
      const key = `${folder}/${path.basename(filePath)}`;
      const result = await this.storage.uploadFileFromPath(filePath, key, {
        contentType: this.getContentType(filePath)
      });
      return result.url;
    } catch (error) {
      console.error('Failed to upload to storage:', error);
      return null;
    }
  }

  // Get content type from file extension
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.webm': 'video/webm',
      '.flv': 'video/x-flv',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  // Clean up temporary files
  async cleanup(files) {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.warn(`Failed to cleanup file ${file}:`, error.message);
      }
    }
  }

  // Get processing status
  getProcessingStatus(jobId) {
    // This would integrate with a job queue system
    // For now, return a simple status
    return {
      id: jobId,
      status: 'completed',
      progress: 100
    };
  }
}

export default VideoProcessor;