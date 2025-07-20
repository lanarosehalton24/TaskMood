import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function VoiceInput({ 
  onTranscript, 
  variant = "outline", 
  size = "default",
  className 
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsModalOpen(false);
        toast({
          title: "Voice input error",
          description: "Could not process voice input. Please try again.",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript) {
          onTranscript(transcript);
          setTranscript("");
        }
        setIsModalOpen(false);
      };

      setRecognition(recognition);
    }
  }, [transcript, onTranscript, toast]);

  const startListening = () => {
    if (recognition) {
      setIsModalOpen(true);
      setTranscript("");
      recognition.start();
    } else {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  const cancelListening = () => {
    if (recognition && isListening) {
      recognition.abort();
    }
    setIsListening(false);
    setIsModalOpen(false);
    setTranscript("");
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={startListening}
        disabled={isListening}
        className={cn("", className)}
      >
        {isListening ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {size !== "icon" && (
          <span className="ml-2">Voice Input</span>
        )}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Input</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors",
              isListening 
                ? "bg-destructive animate-pulse" 
                : "bg-primary"
            )}>
              {isListening ? (
                <MicOff className="text-white text-3xl" />
              ) : (
                <Mic className="text-white text-3xl" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isListening ? "Listening..." : "Ready to listen"}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {isListening 
                ? "Speak now, I'm listening..." 
                : "Click the microphone to start speaking"
              }
            </p>

            {transcript && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  "{transcript}"
                </p>
              </div>
            )}
            
            <div className="flex justify-center space-x-4">
              {isListening ? (
                <>
                  <Button variant="destructive" onClick={stopListening}>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                  <Button variant="outline" onClick={cancelListening}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
