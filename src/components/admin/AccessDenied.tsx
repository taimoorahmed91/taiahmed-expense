import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-card)' }}>
      <Card className="w-full max-w-md border-border/20" style={{ background: 'var(--gradient-card)' }}>
        <CardContent className="flex flex-col items-center text-center p-8">
          <div className="mb-6 p-4 rounded-full bg-destructive/10">
            <Shield className="h-12 w-12 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Oops! You are not entitled to see this page. This area is restricted to administrators only.
          </p>
          
          <Button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};