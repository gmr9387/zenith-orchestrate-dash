import { nanoid } from 'nanoid';

class VideoAnalytics {
  constructor(db) {
    this.db = db;
    this.setupDatabase();
  }

  setupDatabase() {
    // Video analytics tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS video_views (
        id TEXT PRIMARY KEY,
        videoId TEXT NOT NULL,
        userId TEXT,
        sessionId TEXT NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        country TEXT,
        city TEXT,
        startedAt TEXT NOT NULL,
        endedAt TEXT,
        duration INTEGER,
        progress REAL,
        quality TEXT,
        deviceType TEXT,
        platform TEXT,
        FOREIGN KEY (videoId) REFERENCES videos(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS video_engagement (
        id TEXT PRIMARY KEY,
        videoId TEXT NOT NULL,
        sessionId TEXT NOT NULL,
        timestamp REAL NOT NULL,
        eventType TEXT NOT NULL,
        eventData TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (videoId) REFERENCES videos(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS video_comments (
        id TEXT PRIMARY KEY,
        videoId TEXT NOT NULL,
        userId TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp REAL,
        parentId TEXT,
        likes INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (videoId) REFERENCES videos(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parentId) REFERENCES video_comments(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS video_shares (
        id TEXT PRIMARY KEY,
        videoId TEXT NOT NULL,
        userId TEXT,
        platform TEXT NOT NULL,
        shareUrl TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (videoId) REFERENCES videos(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(videoId);
      CREATE INDEX IF NOT EXISTS idx_video_views_session_id ON video_views(sessionId);
      CREATE INDEX IF NOT EXISTS idx_video_engagement_video_id ON video_engagement(videoId);
      CREATE INDEX IF NOT EXISTS idx_video_engagement_session_id ON video_engagement(sessionId);
      CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(videoId);
      CREATE INDEX IF NOT EXISTS idx_video_shares_video_id ON video_shares(videoId);
    `);

    // Prepared statements
    this.insertView = this.db.prepare(`
      INSERT INTO video_views (id, videoId, userId, sessionId, ipAddress, userAgent, country, city, startedAt, endedAt, duration, progress, quality, deviceType, platform)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.updateView = this.db.prepare(`
      UPDATE video_views SET endedAt = ?, duration = ?, progress = ? WHERE sessionId = ?
    `);

    this.insertEngagement = this.db.prepare(`
      INSERT INTO video_engagement (id, videoId, sessionId, timestamp, eventType, eventData, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    this.insertComment = this.db.prepare(`
      INSERT INTO video_comments (id, videoId, userId, content, timestamp, parentId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    this.insertShare = this.db.prepare(`
      INSERT INTO video_shares (id, videoId, userId, platform, shareUrl, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    this.getVideoStats = this.db.prepare(`
      SELECT 
        COUNT(DISTINCT sessionId) as totalViews,
        COUNT(DISTINCT userId) as uniqueViewers,
        AVG(duration) as avgWatchTime,
        AVG(progress) as avgCompletion,
        COUNT(CASE WHEN progress >= 0.9 THEN 1 END) as completions
      FROM video_views 
      WHERE videoId = ?
    `);

    this.getEngagementEvents = this.db.prepare(`
      SELECT eventType, COUNT(*) as count
      FROM video_engagement 
      WHERE videoId = ? 
      GROUP BY eventType
    `);

    this.getViewerRetention = this.db.prepare(`
      SELECT 
        CASE 
          WHEN progress < 0.25 THEN '0-25%'
          WHEN progress < 0.5 THEN '25-50%'
          WHEN progress < 0.75 THEN '50-75%'
          WHEN progress < 0.9 THEN '75-90%'
          ELSE '90-100%'
        END as segment,
        COUNT(*) as viewers
      FROM video_views 
      WHERE videoId = ?
      GROUP BY segment
      ORDER BY 
        CASE segment
          WHEN '0-25%' THEN 1
          WHEN '25-50%' THEN 2
          WHEN '50-75%' THEN 3
          WHEN '75-90%' THEN 4
          WHEN '90-100%' THEN 5
        END
    `);
  }

  // Track video view start
  trackViewStart(videoId, sessionId, userId = null, metadata = {}) {
    const {
      ipAddress,
      userAgent,
      country = 'Unknown',
      city = 'Unknown',
      quality = 'auto',
      deviceType = 'desktop',
      platform = 'web'
    } = metadata;

    this.insertView.run(
      nanoid(),
      videoId,
      userId,
      sessionId,
      ipAddress,
      userAgent,
      country,
      city,
      new Date().toISOString(),
      null,
      0,
      0,
      quality,
      deviceType,
      platform
    );
  }

  // Track video view end
  trackViewEnd(sessionId, duration, progress) {
    this.updateView.run(
      new Date().toISOString(),
      duration,
      progress,
      sessionId
    );
  }

  // Track engagement events
  trackEngagement(videoId, sessionId, eventType, eventData = null, timestamp = null) {
    this.insertEngagement.run(
      nanoid(),
      videoId,
      sessionId,
      timestamp || 0,
      eventType,
      eventData ? JSON.stringify(eventData) : null,
      new Date().toISOString()
    );
  }

  // Add comment
  addComment(videoId, userId, content, timestamp = null, parentId = null) {
    this.insertComment.run(
      nanoid(),
      videoId,
      userId,
      content,
      timestamp,
      parentId,
      new Date().toISOString()
    );
  }

  // Track share
  trackShare(videoId, userId, platform, shareUrl = null) {
    this.insertShare.run(
      nanoid(),
      videoId,
      userId,
      platform,
      shareUrl,
      new Date().toISOString()
    );
  }

  // Get comprehensive video analytics
  getVideoAnalytics(videoId) {
    const stats = this.getVideoStats.get(videoId);
    const engagement = this.getEngagementEvents.all(videoId);
    const retention = this.getViewerRetention.all(videoId);

    // Calculate engagement rate
    const totalEngagement = engagement.reduce((sum, e) => sum + e.count, 0);
    const engagementRate = stats.totalViews > 0 ? (totalEngagement / stats.totalViews) : 0;

    // Get recent activity
    const recentViews = this.db.prepare(`
      SELECT * FROM video_views 
      WHERE videoId = ? 
      ORDER BY startedAt DESC 
      LIMIT 10
    `).all(videoId);

    const recentComments = this.db.prepare(`
      SELECT vc.*, u.firstName, u.lastName 
      FROM video_comments vc
      LEFT JOIN users u ON vc.userId = u.id
      WHERE vc.videoId = ? 
      ORDER BY vc.createdAt DESC 
      LIMIT 10
    `).all(videoId);

    return {
      overview: {
        totalViews: stats.totalViews || 0,
        uniqueViewers: stats.uniqueViewers || 0,
        avgWatchTime: Math.round((stats.avgWatchTime || 0) / 1000), // seconds
        avgCompletion: Math.round((stats.avgCompletion || 0) * 100), // percentage
        completions: stats.completions || 0,
        engagementRate: Math.round(engagementRate * 100) // percentage
      },
      engagement: engagement.map(e => ({
        type: e.eventType,
        count: e.count
      })),
      retention: retention.map(r => ({
        segment: r.segment,
        viewers: r.viewers
      })),
      recentActivity: {
        views: recentViews,
        comments: recentComments
      }
    };
  }

  // Get viewer heatmap data
  getViewerHeatmap(videoId) {
    const heatmapData = this.db.prepare(`
      SELECT 
        ROUND(timestamp / 10) * 10 as timeSegment,
        COUNT(*) as viewers
      FROM video_engagement 
      WHERE videoId = ? AND eventType = 'play'
      GROUP BY timeSegment
      ORDER BY timeSegment
    `).all(videoId);

    return heatmapData.map(point => ({
      time: point.timeSegment,
      viewers: point.viewers
    }));
  }

  // Get geographic distribution
  getGeographicDistribution(videoId) {
    return this.db.prepare(`
      SELECT 
        country,
        city,
        COUNT(*) as views
      FROM video_views 
      WHERE videoId = ?
      GROUP BY country, city
      ORDER BY views DESC
      LIMIT 20
    `).all(videoId);
  }

  // Get device/platform breakdown
  getDeviceBreakdown(videoId) {
    const devices = this.db.prepare(`
      SELECT 
        deviceType,
        COUNT(*) as views
      FROM video_views 
      WHERE videoId = ?
      GROUP BY deviceType
    `).all(videoId);

    const platforms = this.db.prepare(`
      SELECT 
        platform,
        COUNT(*) as views
      FROM video_views 
      WHERE videoId = ?
      GROUP BY platform
    `).all(videoId);

    return { devices, platforms };
  }

  // Get trending videos
  getTrendingVideos(limit = 10, period = '7d') {
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 1;
    
    return this.db.prepare(`
      SELECT 
        v.id,
        v.title,
        COUNT(DISTINCT vv.sessionId) as views,
        AVG(vv.progress) as avgCompletion,
        COUNT(DISTINCT vc.id) as comments
      FROM videos v
      LEFT JOIN video_views vv ON v.id = vv.videoId 
        AND vv.startedAt >= datetime('now', '-${daysAgo} days')
      LEFT JOIN video_comments vc ON v.id = vc.videoId 
        AND vc.createdAt >= datetime('now', '-${daysAgo} days')
      WHERE v.deletedAt IS NULL
      GROUP BY v.id
      ORDER BY views DESC, avgCompletion DESC
      LIMIT ?
    `).all(limit);
  }
}

export default VideoAnalytics;