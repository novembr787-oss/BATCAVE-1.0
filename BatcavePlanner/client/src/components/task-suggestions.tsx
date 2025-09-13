import { useState } from 'react';
import { Lightbulb, Plus, Loader2, Sparkles, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/lib/theme-context';

interface TaskSuggestion {
  title: string;
  description: string;
  domain: string;
  priority: string;
  estimatedHours: number;
  reasoning: string;
}

const priorityColors = {
  low: 'text-blue-400 border-blue-400/20 bg-blue-400/10',
  medium: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10',
  high: 'text-orange-400 border-orange-400/20 bg-orange-400/10',
  urgent: 'text-red-400 border-red-400/20 bg-red-400/10',
};

const domainIcons = {
  academic: Target,
  fitness: Clock,
  creative: Sparkles,
  social: Plus,
  maintenance: Target,
};

export function TaskSuggestions() {
  const { toast } = useToast();
  const { calculateEU } = useTheme();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch AI suggestions
  const { data: suggestions = [], isLoading, error, refetch } = useQuery<TaskSuggestion[]>({
    queryKey: ['/api/tasks/suggestions'],
    enabled: isOpen, // Only fetch when dialog is open
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Create task from suggestion
  const createTaskMutation = useMutation({
    mutationFn: async (suggestion: TaskSuggestion) => {
      return apiRequest('POST', '/api/tasks', {
        title: suggestion.title,
        description: suggestion.description,
        domain: suggestion.domain,
        priority: suggestion.priority,
        estimatedHours: suggestion.estimatedHours,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Mission Added',
        description: 'ALFRED has successfully added the suggested task to your queue.',
      });
      setIsOpen(false);
    },
    onError: () => {
      toast({
        title: 'Mission Failed',
        description: 'Failed to add the suggested task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateTask = (suggestion: TaskSuggestion) => {
    createTaskMutation.mutate(suggestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 bg-primary/10 border-primary/20 hover:bg-primary/20"
          data-testid="button-ai-suggestions"
        >
          <Lightbulb className="h-4 w-4" />
          ALFRED Suggestions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-orbitron flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            ALFRED's Strategic Recommendations
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                ALFRED is analyzing your mission parameters...
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12" data-testid="error-state-suggestions">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-medium mb-2">ALFRED Offline</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  {error instanceof Error 
                    ? error.message.includes('API key') 
                      ? "ALFRED access denied. Please configure your API key to enable AI recommendations."
                      : error.message.includes('quota') || error.message.includes('rate')
                      ? "ALFRED is overloaded. The API quota has been exceeded. Please try again later."
                      : error.message.includes('network')
                      ? "Communication with ALFRED failed. Please check your network connection."
                      : error.message || "ALFRED encountered an unexpected error."
                    : "ALFRED is currently offline. Strategic analysis unavailable."
                  }
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => refetch()} 
                  variant="outline"
                  data-testid="button-retry-suggestions"
                >
                  Retry Connection
                </Button>
                <Button 
                  onClick={() => setIsOpen(false)} 
                  variant="ghost"
                  data-testid="button-close-error"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state-suggestions">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                  <Lightbulb className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Recommendations</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  ALFRED has no strategic recommendations at this time. Try adding more tasks to your queue for better mission analysis.
                </p>
              </div>
              <Button 
                onClick={() => refetch()} 
                variant="outline"
                data-testid="button-reanalyze-suggestions"
              >
                Re-analyze Mission
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {suggestions.map((suggestion, index) => {
                const DomainIcon = domainIcons[suggestion.domain as keyof typeof domainIcons] || Target;
                const euValue = calculateEU(suggestion.estimatedHours, suggestion.domain as 'academic' | 'fitness' | 'creative' | 'social' | 'maintenance');
                
                return (
                  <Card 
                    key={index} 
                    className="hover-elevate bg-card/95 backdrop-blur-sm border-border/50"
                    data-testid={`card-suggestion-${index}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                            <DomainIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${priorityColors[suggestion.priority as keyof typeof priorityColors]}`}
                              >
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {suggestion.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {suggestion.estimatedHours}h estimated
                              </div>
                              <div className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                {euValue.toFixed(1)} EU
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-primary">{suggestion.domain}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleCreateTask(suggestion)}
                          disabled={createTaskMutation.isPending}
                          className="gap-1 shrink-0"
                          data-testid={`button-add-suggestion-${index}`}
                        >
                          <Plus className="h-3 w-3" />
                          Add to Queue
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                        <div className="text-xs text-muted-foreground mb-1 font-medium">
                          ALFRED's Strategic Analysis:
                        </div>
                        <p className="text-sm text-foreground">
                          {suggestion.reasoning}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          <div className="flex justify-between items-center pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Powered by ALFRED - AI Strategic Assistant
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="sm"
                data-testid="button-refresh-analysis"
              >
                Refresh Analysis
              </Button>
              <Button 
                onClick={() => setIsOpen(false)} 
                variant="outline" 
                size="sm"
                data-testid="button-close-dialog"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}