import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, User, Mail, Upload, Trash2, Save } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  total_points: number;
  total_games: number;
  total_wins: number;
  win_streak: number;
  longest_win_streak: number;
  countries_mastered: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setUsername(data.username);
        setAvatarPreview(data.avatar_url);
      } else {
        toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
        navigate('/lobby');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (username === profile?.username) {
      toast({ title: 'No changes', description: 'Username is the same' });
      return;
    }

    if (username.length < 3 || username.length > 32) {
      toast({ title: 'Invalid username', description: 'Username must be 3-32 characters', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('username', username);
        toast({ title: 'Success', description: 'Username updated successfully' });
        fetchProfile();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to update username', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Avatar must be less than 2MB', variant: 'destructive' });
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Only JPG, PNG, and WebP are allowed', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAvatarPreview(data.avatar_url);
        toast({ title: 'Success', description: 'Avatar uploaded successfully' });
        fetchProfile();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to upload avatar', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAvatarPreview(null);
        toast({ title: 'Success', description: 'Avatar deleted successfully' });
        fetchProfile();
      } else {
        toast({ title: 'Error', description: 'Failed to delete avatar', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <ThemeToggle />
      
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => navigate('/lobby')}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="flex gap-2">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    maxLength={32}
                  />
                  <Button
                    onClick={handleUpdateUsername}
                    disabled={saving || username === profile?.username}
                    size="icon"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">3-32 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Management */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>Upload or remove your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-border">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  {avatarPreview && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAvatar}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>

                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />

                <p className="text-xs text-muted-foreground text-center">
                  JPG, PNG, or WebP • Max 2MB
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="bg-card text-card-foreground md:col-span-2">
            <CardHeader>
              <CardTitle>Game Statistics</CardTitle>
              <CardDescription>Your gaming achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-xl text-center">
                  <div className="text-3xl font-bold text-primary">{profile?.total_points || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Points</div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl text-center">
                  <div className="text-3xl font-bold text-primary">{profile?.total_games || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Games Played</div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl text-center">
                  <div className="text-3xl font-bold text-primary">{profile?.total_wins || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Wins</div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl text-center">
                  <div className="text-3xl font-bold text-primary">{profile?.win_streak || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Current Streak</div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl text-center">
                  <div className="text-3xl font-bold text-primary">{profile?.longest_win_streak || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Best Streak</div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl text-center">
                  <div className="text-3xl font-bold text-primary">{profile?.countries_mastered || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Countries Mastered</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
