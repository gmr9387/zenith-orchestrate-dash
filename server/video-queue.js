import { getRedisClient } from './redis.js';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

class VideoQueue {
  constructor(db, config = {}) {
    this.db = db;
    this.config = {
      queueName: 'video-processing',
      concurrency: config.concurrency || 2,
      ...config
    };

    this.redis = getRedisClient();
    this.queue = null;
    this.worker = null;
    this.scheduler = null;
    
    this.setupQueue();
  }

  setupQueue() {
    if (!this.redis) {
      console.warn('Redis not available, video queue will use in-memory processing');
      return;
    }

    try {
      const { Queue, Worker, QueueScheduler } = require('bullmq');

      // Create queue
      this.queue = new Queue(this.config.queueName, {
        connection: this.redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: 10,
          removeOnFail: 5
        }
      });

      // Create scheduler for delayed jobs
      this.scheduler = new QueueScheduler(this.config.queueName, {
        connection: this.redis
      });

      // Create worker
      this.worker = new Worker(this.config.queueName, async (job) => {
        return await this.processVideoJob(job);
      }, {
        connection: this.redis,
        concurrency: this.config.concurrency
      });

      // Handle worker events
      this.worker.on('completed', (job) => {
        console.log(`Video job ${job.id} completed successfully`);
        this.updateJobStatus(job.data.videoId, 'completed', job.returnvalue);
      });

      this.worker.on('failed', (job, err) => {
        console.error(`Video job ${job.id} failed:`, err.message);
        this.updateJobStatus(job.data.videoId, 'failed', null, err.message);
      });

      this.worker.on('progress', (job, progress) => {
        this.updateJobProgress(job.data.videoId, progress);
      });

      console.log('Video processing queue initialized');
    } catch (error) {
      console.warn('BullMQ not available, video queue will use in-memory processing:', error.message);
    }
  }

  // Add video processing job to queue
  async addVideoJob(videoId, originalPath, options = {}) {
    const jobData = {
      videoId,
      originalPath,
      options: {
        generateThumbnails: true,
        qualities: ['720p', '480p'],
        hls: true,
        ...options
      }
    };

    if (this.queue) {
      const job = await this.queue.add('process-video', jobData, {
        jobId: videoId,
        priority: options.priority || 0
      });
      
      console.log(`Video job added to queue: ${job.id}`);
      return job.id;
    } else {
      // Fallback to immediate processing
      console.log('Processing video immediately (no queue)');
      return await this.processVideoImmediate(videoId, originalPath, options);
    }
  }

  // Process video job (worker function)
  async processVideoJob(job) {
    const { videoId, originalPath, options } = job.data;
    
    console.log(`Processing video job: ${videoId}`);
    
    try {
      // Update status to processing
      this.updateJobStatus(videoId, 'processing');

      // Initialize video processor
      let VideoProcessor;
      try {
        const mod = await import('./video-processor.js');
        VideoProcessor = mod.default;
      } catch (error) {
        throw new Error('Video processor not available');
      }

      const videoProcessor = new VideoProcessor({
        outputDir: path.join(process.cwd(), 'server/processed-videos'),
        thumbnailDir: path.join(process.cwd(), 'server/thumbnails'),
        hlsDir: path.join(process.cwd(), 'server/hls')
      });

      // Process video with progress updates
      const result = await this.processVideoWithProgress(videoProcessor, originalPath, options, (progress) => {
        job.updateProgress(progress);
      });

      // Update status to completed
      this.updateJobStatus(videoId, 'completed', result);

      return result;

    } catch (error) {
      console.error(`Video processing failed for ${videoId}:`, error);
      this.updateJobStatus(videoId, 'failed', null, error.message);
      throw error;
    }
  }

  // Process video with progress tracking
  async processVideoWithProgress(processor, inputPath, options, progressCallback) {
    const startTime = Date.now();
    let currentStep = 0;
    const totalSteps = 3; // metadata + processing + hls

    // Step 1: Extract metadata
    progressCallback({ step: 'metadata', progress: 0, message: 'Extracting metadata...' });
    const metadata = await processor.getVideoMetadata(inputPath);
    currentStep++;
    progressCallback({ 
      step: 'metadata', 
      progress: (currentStep / totalSteps) * 100, 
      message: 'Metadata extracted',
      metadata 
    });

    // Step 2: Process video (thumbnails + MP4s)
    progressCallback({ step: 'processing', progress: 0, message: 'Processing video...' });
    const result = await processor.processVideo(inputPath, { ...options, hls: false });
    currentStep++;
    progressCallback({ 
      step: 'processing', 
      progress: (currentStep / totalSteps) * 100, 
      message: 'Video processing completed',
      result 
    });

    // Step 3: Generate HLS (if enabled)
    if (options.hls) {
      progressCallback({ step: 'hls', progress: 0, message: 'Generating HLS...' });
      const hlsResult = await processor.generateHLS(
        inputPath, 
        path.join(process.cwd(), 'server/hls'), 
        result.id, 
        options.qualities
      );
      result.hls = hlsResult;
      currentStep++;
      progressCallback({ 
        step: 'hls', 
        progress: (currentStep / totalSteps) * 100, 
        message: 'HLS generation completed',
        hls: hlsResult 
      });
    }

    const processingTime = Date.now() - startTime;
    result.processingTime = processingTime;

    progressCallback({ 
      step: 'complete', 
      progress: 100, 
      message: 'Video processing completed successfully',
      result 
    });

    return result;
  }

  // Fallback immediate processing
  async processVideoImmediate(videoId, originalPath, options) {
    let VideoProcessor;
    try {
      const mod = await import('./video-processor.js');
      VideoProcessor = mod.default;
    } catch (error) {
      throw new Error('Video processor not available');
    }

    const processor = new VideoProcessor({
      outputDir: path.join(process.cwd(), 'server/processed-videos'),
      thumbnailDir: path.join(process.cwd(), 'server/thumbnails'),
      hlsDir: path.join(process.cwd(), 'server/hls')
    });

    const result = await processor.processVideo(originalPath, options);
    this.updateJobStatus(videoId, 'completed', result);
    return videoId;
  }

  // Update job status in database
  updateJobStatus(videoId, status, result = null, error = null) {
    try {
      const now = new Date().toISOString();
      
      if (result) {
        const processed = { ...result.processed };
        if (result.hls) {
          processed['hls'] = { manifestPath: result.hls.manifestPath, baseDir: result.hls.baseDir };
        }
        const processedPaths = JSON.stringify(processed);
        const thumbnailPaths = JSON.stringify(result.thumbnails.map(t => t.path));
        const metadata = JSON.stringify(result.metadata);

        this.db.prepare(`
          UPDATE videos SET 
            processedPaths = ?, 
            thumbnailPaths = ?, 
            metadata = ?, 
            duration = ?, 
            size = ?, 
            status = ?, 
            processingProgress = ?, 
            updatedAt = ?
          WHERE id = ?
        `).run(
          processedPaths,
          thumbnailPaths,
          metadata,
          result.metadata.duration,
          result.metadata.size,
          status,
          status === 'completed' ? 100 : 0,
          now,
          videoId
        );
      } else {
        this.db.prepare(`
          UPDATE videos SET 
            status = ?, 
            processingProgress = ?, 
            updatedAt = ?
          WHERE id = ?
        `).run(
          status,
          status === 'completed' ? 100 : (status === 'processing' ? 0 : 0),
          now,
          videoId
        );
      }
    } catch (err) {
      console.error('Failed to update job status:', err);
    }
  }

  // Update job progress in database
  updateJobProgress(videoId, progress) {
    try {
      const progressPercent = progress.progress || 0;
      this.db.prepare(`
        UPDATE videos SET 
          processingProgress = ?, 
          updatedAt = ?
        WHERE id = ?
      `).run(progressPercent, new Date().toISOString(), videoId);
    } catch (err) {
      console.error('Failed to update job progress:', err);
    }
  }

  // Get job status
  async getJobStatus(videoId) {
    if (!this.queue) {
      return { status: 'no-queue' };
    }

    try {
      const job = await this.queue.getJob(videoId);
      if (!job) {
        return { status: 'not-found' };
      }

      return {
        id: job.id,
        status: await job.getState(),
        progress: job.progress,
        data: job.data,
        failedReason: job.failedReason
      };
    } catch (error) {
      console.error('Failed to get job status:', error);
      return { status: 'error', error: error.message };
    }
  }

  // Get queue statistics
  async getQueueStats() {
    if (!this.queue) {
      return { error: 'Queue not available' };
    }

    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.queue.getWaiting(),
        this.queue.getActive(),
        this.queue.getCompleted(),
        this.queue.getFailed()
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return { error: error.message };
    }
  }

  // Clean up
  async close() {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.scheduler) {
      await this.scheduler.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
  }
}

export default VideoQueue;