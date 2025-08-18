import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceNavigationProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export function VoiceNavigation({ isActive, onToggle }: VoiceNavigationProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [commands, setCommands] = useState<string[]>([]);

  // Voice command patterns
  const commandPatterns = {
    'switch to api hub': () => console.log('Switching to API Hub'),
    'create tutorial': () => console.log('Creating tutorial'),
    'new video project': () => console.log('Creating video project'),
    'open workflow builder': () => console.log('Opening workflow builder'),
    'show crm contacts': () => console.log('Showing CRM contacts'),
    'search commands': () => console.log('Opening command palette'),
    'take me to dashboard': () => console.log('Going to dashboard')
  };

  useEffect(() => {
    if (isActive && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            setConfidence(result[0].confidence);
            
            // Process voice command
            const command = finalTranscript.toLowerCase().trim();
            if (commandPatterns[command as keyof typeof commandPatterns]) {
              commandPatterns[command as keyof typeof commandPatterns]();
              setCommands(prev => [command, ...prev.slice(0, 4)]);
            }
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isActive) {
          // Auto-restart if still active
          setTimeout(() => recognition.start(), 100);
        }
      };

      recognition.start();

      return () => {
        recognition.stop();
      };
    }
  }, [isActive]);

  return (
    <div className="relative">
      {/* Voice Toggle Button */}
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(!isActive)}
        className={`relative transition-all duration-300 ${
          isListening ? 'animate-pulse' : ''
        }`}
      >
        {isActive ? (
          <Mic className="w-4 h-4" />
        ) : (
          <MicOff className="w-4 h-4" />
        )}
        
        {/* Listening Indicator */}
        {isListening && (
          <motion.div
            className="absolute -inset-1 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </Button>

      {/* Voice Interface Overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute top-full right-0 mt-2 w-80 p-4 rounded-2xl glass-intense"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Status Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Voice Navigation</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                isListening ? 'bg-success animate-pulse' : 'bg-muted'
              }`} />
            </div>

            {/* Current Transcript */}
            <div className="mb-3 p-3 rounded-lg bg-muted/20 min-h-[60px]">
              <div className="text-xs text-muted-foreground mb-1">
                {isListening ? 'Listening...' : 'Waiting for voice command'}
              </div>
              <div className="text-sm">
                {transcript || 'Say "Switch to CRM" or "Create tutorial"'}
              </div>
              
              {/* Confidence Meter */}
              {confidence > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Confidence:</span>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-success"
                        initial={{ width: 0 }}
                        animate={{ width: `${confidence * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span>{Math.round(confidence * 100)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Available Commands */}
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-2">Try saying:</div>
              <div className="space-y-1">
                {Object.keys(commandPatterns).slice(0, 3).map((command, index) => (
                  <motion.div
                    key={command}
                    className="text-xs p-2 rounded bg-muted/10 border border-muted/20"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    "{command}"
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Commands */}
            {commands.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Recent commands:</div>
                <div className="space-y-1">
                  {commands.map((command, index) => (
                    <motion.div
                      key={`${command}-${index}`}
                      className="text-xs p-1.5 rounded bg-success/10 text-success border border-success/20"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      ✓ {command}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
              Voice commands work across all tools. Speak naturally.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}