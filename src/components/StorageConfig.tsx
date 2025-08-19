import { useState, useEffect } from 'react';
import { Save, TestTube, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { storageManager, StorageConfig as StorageConfigType } from '../lib/storage';

export const StorageConfig = () => {
  const [config, setConfig] = useState<StorageConfigType>({
    provider: 's3',
    endpoint: '',
    bucket: '',
    region: '',
    accessKeyId: '',
    secretAccessKey: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Load existing configuration from localStorage or environment
    const loadConfig = () => {
      try {
        const savedConfig = localStorage.getItem('zilliance_storage_config');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          setConfig(parsed);
          setIsConfigured(true);
        }
      } catch (error) {
        console.error('Failed to load storage config:', error);
      }
    };

    loadConfig();
  }, []);

  const handleInputChange = (key: keyof StorageConfigType, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('zilliance_storage_config', JSON.stringify(config));
      
      // Initialize storage manager
      await storageManager.initialize(config);
      
      setIsConfigured(true);
      setTestResult({
        success: true,
        message: 'Storage configuration saved successfully!',
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Failed to save configuration: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      await storageManager.initialize(config);
      setTestResult({
        success: true,
        message: 'Connection test successful! Storage is ready to use.',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${error}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getEndpointPlaceholder = () => {
    if (config.endpoint.includes('amazonaws.com')) {
      return 'https://s3.amazonaws.com';
    } else if (config.endpoint.includes('digitalocean.com')) {
      return 'https://nyc3.digitaloceanspaces.com';
    } else if (config.endpoint.includes('cloudflare.com')) {
      return 'https://pub-1234567890.r2.dev';
    }
    return 'https://your-storage-endpoint.com';
  };

  const getRegionPlaceholder = () => {
    if (config.endpoint.includes('amazonaws.com')) {
      return 'us-east-1';
    } else if (config.endpoint.includes('digitalocean.com')) {
      return 'nyc3';
    } else if (config.endpoint.includes('cloudflare.com')) {
      return 'auto';
    }
    return 'your-region';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Storage Configuration</h1>
        <p className="text-muted-foreground">
          Configure your S3-compatible storage for file uploads and media management
        </p>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Storage Settings
          </CardTitle>
          <CardDescription>
            Enter your S3-compatible storage credentials and connection details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="provider">Storage Provider</Label>
              <select
                id="provider"
                value={config.provider}
                onChange={(e) => handleInputChange('provider', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="s3">Amazon S3</option>
                <option value="minio">MinIO</option>
                <option value="digitalocean">DigitalOcean Spaces</option>
                <option value="cloudflare">Cloudflare R2</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Select your storage service provider
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">Storage Endpoint</Label>
              <Input
                id="endpoint"
                type="url"
                placeholder={getEndpointPlaceholder()}
                value={config.endpoint}
                onChange={(e) => handleInputChange('endpoint', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The URL endpoint for your storage service
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bucket">Bucket Name</Label>
              <Input
                id="bucket"
                placeholder="my-storage-bucket"
                value={config.bucket}
                onChange={(e) => handleInputChange('bucket', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The name of your storage bucket or container
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                placeholder={getRegionPlaceholder()}
                value={config.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The region where your storage is located
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessKeyId">Access Key ID</Label>
              <Input
                id="accessKeyId"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                value={config.accessKeyId}
                onChange={(e) => handleInputChange('accessKeyId', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your storage service access key
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretAccessKey">Secret Access Key</Label>
            <Input
              id="secretAccessKey"
              type="password"
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              value={config.secretAccessKey}
              onChange={(e) => handleInputChange('secretAccessKey', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your storage service secret key (keep this secure)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !config.endpoint || !config.bucket || !config.accessKeyId || !config.secretAccessKey}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isLoading || !config.endpoint || !config.bucket || !config.accessKeyId || !config.secretAccessKey}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Alert className={testResult.success ? 'border-success' : 'border-destructive'}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription className={testResult.success ? 'text-success' : 'text-destructive'}>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Status</CardTitle>
          <CardDescription>
            Current storage connection status and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-success' : 'bg-muted'}`} />
                <span className="text-sm">
                  {isConfigured ? 'Connected' : 'Not Configured'}
                </span>
              </div>
            </div>
            
            {isConfigured && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Provider</span>
                  <span className="text-sm text-muted-foreground font-mono capitalize">
                    {config.provider}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Endpoint</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {config.endpoint}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bucket</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {config.bucket}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Region</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {config.region}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Supported Services */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Storage Services</CardTitle>
          <CardDescription>
            Zilliance works with any S3-compatible storage service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Amazon S3</h3>
              <p className="text-sm text-muted-foreground">
                Industry standard cloud storage with global availability
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">DigitalOcean Spaces</h3>
              <p className="text-sm text-muted-foreground">
                Simple and cost-effective S3-compatible storage
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Cloudflare R2</h3>
              <p className="text-sm text-muted-foreground">
                Zero egress fees with global edge locations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};