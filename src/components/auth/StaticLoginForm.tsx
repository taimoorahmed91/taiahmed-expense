import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaticLoginFormProps {
  onSuccess: (userData: any) => void;
  onCancel: () => void;
}

export const StaticLoginForm = ({ onSuccess, onCancel }: StaticLoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('authenticate_static_user', {
        username_param: username,
        password_param: password
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Error",
          description: "Invalid username or password",
          variant: "destructive",
        });
        return;
      }

      const userData = data[0];
      
      // Store session info in localStorage for static users
      localStorage.setItem('static_user_session', JSON.stringify({
        user_id: userData.user_id,
        username: userData.username,
        session_token: userData.session_token,
        login_time: new Date().toISOString()
      }));

      toast({
        title: "Success",
        description: `Welcome, ${userData.username}!`,
      });

      onSuccess(userData);
    } catch (error) {
      console.error('Error during static login:', error);
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Static User Login</CardTitle>
        <CardDescription>
          Login with your assigned username and password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};