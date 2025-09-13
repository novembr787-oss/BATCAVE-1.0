import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-orbitron font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
        {title}
      </h1>
      <div className="h-0.5 w-20 bg-gradient-to-r from-primary to-transparent mb-6"></div>
      
      <Card className="hover-elevate bg-card/95 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-primary" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
          <div className="mt-6 h-32 bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🧬</div>
              <p className="text-sm text-muted-foreground">This module is under construction</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}