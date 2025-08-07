import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chrome, TrendingUp } from 'lucide-react';
import { useAuth } from './AuthProvider';

export const LoginPage = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ background: 'var(--gradient-card)' }}>
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
               style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}>
            <TrendingUp className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">ExpenseTracker</h1>
          <p className="text-muted-foreground mt-2">Your premium expense management solution</p>
        </div>

        {/* Login Card */}
        <Card className="border-border/20" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-2xl text-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to access your personalized expense dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              onClick={signInWithGoogle}
              className="w-full h-12 text-lg font-semibold transition-all duration-300 hover:scale-105"
              style={{ 
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-elegant)'
              }}
            >
              <Chrome className="w-5 h-5 mr-3" />
              Continue with Google
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                By signing in, you agree to our terms of service and privacy policy
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="text-center p-4 rounded-lg border border-border/20" 
               style={{ background: 'var(--gradient-card)' }}>
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm text-muted-foreground">Smart Analytics</p>
          </div>
          <div className="text-center p-4 rounded-lg border border-border/20" 
               style={{ background: 'var(--gradient-card)' }}>
            <div className="text-2xl mb-2">💳</div>
            <p className="text-sm text-muted-foreground">Budget Tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
};