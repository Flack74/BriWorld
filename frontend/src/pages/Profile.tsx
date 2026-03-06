import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit2, Upload, X, Trophy, Zap, Target, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchWithTokenRefresh } from "@/lib/tokenRefresh";
import RankBadge from "@/components/RankBadge";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const baseURL = window.location.origin;
      const response = await fetchWithTokenRefresh(`${baseURL}/api/user/profile`);
      if (response.ok) {
        const data = await response.json();
        console.log("Profile data:", data);
        setProfile(data);
        setNewUsername(data.username);
      } else if (response.status === 401) {
        navigate("/login");
      } else {
        const errorData = await response.json();
        console.error("Profile fetch error:", errorData);
        setError("Failed to load profile");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    try {
      setError("");
      setSuccess("");
      if (!newUsername.trim()) {
        setError("Username cannot be empty");
        return;
      }
      const baseURL = window.location.origin;
      const response = await fetchWithTokenRefresh(`${baseURL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: newUsername }),
      });
      
      if (response.ok) {
        localStorage.setItem("username", newUsername);
        setProfile({ ...profile, username: newUsername });
        setEditingUsername(false);
        setSuccess("Username updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update username");
      }
    } catch (err) {
      setError("Failed to update username");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setError("");
      const baseURL = window.location.origin;
      const response = await fetchWithTokenRefresh(`${baseURL}/api/user/avatar`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSuccess("Avatar uploaded successfully!");
        setTimeout(() => setSuccess(""), 3000);
        fetchProfile();
      } else {
        setError("Failed to upload avatar");
      }
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      setError("Failed to upload avatar");
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setError("");
      const baseURL = window.location.origin;
      const response = await fetchWithTokenRefresh(`${baseURL}/api/user/avatar`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Avatar deleted successfully!");
        setTimeout(() => setSuccess(""), 3000);
        fetchProfile();
      } else {
        setError("Failed to delete avatar");
      }
    } catch (err) {
      console.error("Failed to delete avatar:", err);
      setError("Failed to delete avatar");
    }
  };

  const getRank = (totalPoints: number) => {
    if (totalPoints >= 10000) return { rank: "Legendary", icon: "👑", color: "text-yellow-500", bgColor: "from-yellow-500/20 to-yellow-600/20" };
    if (totalPoints >= 5000) return { rank: "Master", icon: "🏆", color: "text-purple-500", bgColor: "from-purple-500/20 to-purple-600/20" };
    if (totalPoints >= 2000) return { rank: "Expert", icon: "⭐", color: "text-blue-500", bgColor: "from-blue-500/20 to-blue-600/20" };
    if (totalPoints >= 1000) return { rank: "Advanced", icon: "🎯", color: "text-green-500", bgColor: "from-green-500/20 to-green-600/20" };
    if (totalPoints >= 500) return { rank: "Intermediate", icon: "📈", color: "text-orange-500", bgColor: "from-orange-500/20 to-orange-600/20" };
    return { rank: "Beginner", icon: "🌱", color: "text-gray-500", bgColor: "from-gray-500/20 to-gray-600/20" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error || "Failed to load profile"}</p>
          <Button onClick={() => navigate("/lobby")}>Back to Lobby</Button>
        </div>
      </div>
    );
  }

  const rankInfo = getRank(profile.total_points || 0);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 sm:right-20 w-32 h-32 sm:w-64 sm:h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate("/lobby")}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Lobby
          </Button>
          <h1 className="text-3xl font-bold text-foreground">👤 Profile</h1>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-card/95 backdrop-blur border border-border/50 rounded-2xl p-6 sm:p-8 shadow-lg mb-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-5xl font-bold overflow-hidden border-4 border-primary/20">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile?.username?.charAt(0).toUpperCase()
                  )}
                </div>
                {profile?.avatar_url && (
                  <button
                    onClick={handleDeleteAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Upload Avatar</span>
                </div>
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-6">
              {/* Competitive Rank Badge */}
              {profile?.rating && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border border-primary/20">
                  <div className="text-5xl">🏆</div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Competitive Rank</div>
                    <div className="flex items-center gap-3 mt-1">
                      <RankBadge rank={profile.rank} tier={profile.rank_tier} size="md" />
                      <span className="text-xl font-bold text-foreground">{profile.rating}</span>
                    </div>
                    {!profile.is_placement_complete && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Placement: {profile.placement_matches}/5 matches
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rank Badge */}
              <div className={`flex items-center gap-4 p-4 bg-gradient-to-r ${rankInfo.bgColor} rounded-xl border border-primary/20`}>
                <div className={`text-5xl ${rankInfo.color}`}>{rankInfo.icon}</div>
                <div>
                  <div className="text-sm text-muted-foreground">Legacy Rank</div>
                  <div className={`text-2xl font-bold ${rankInfo.color}`}>{rankInfo.rank}</div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                {editingUsername ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleUpdateUsername}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingUsername(false);
                        setNewUsername(profile?.username);
                        setError("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-lg font-semibold text-foreground">{profile?.username}</div>
                    <button
                      onClick={() => setEditingUsername(true)}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="text-lg text-foreground mt-2 break-all font-medium">
                  {profile?.email || "Not provided"}
                </div>
              </div>

              {/* Member Since */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <div className="text-lg text-foreground mt-2">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-card/95 backdrop-blur border border-border/50 rounded-xl p-6 text-center hover:border-primary/50 transition">
            <div className="text-4xl font-bold text-primary mb-2">{profile?.total_points || 0}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4" />
              Total Points
            </div>
          </div>

          <div className="bg-card/95 backdrop-blur border border-border/50 rounded-xl p-6 text-center hover:border-green-500/50 transition">
            <div className="text-4xl font-bold text-green-500 mb-2">{profile?.total_wins || 0}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              Total Wins
            </div>
          </div>

          <div className="bg-card/95 backdrop-blur border border-border/50 rounded-xl p-6 text-center hover:border-blue-500/50 transition">
            <div className="text-4xl font-bold text-blue-500 mb-2">{profile?.total_games || 0}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Target className="w-4 h-4" />
              Games Played
            </div>
          </div>

          <div className="bg-card/95 backdrop-blur border border-border/50 rounded-xl p-6 text-center hover:border-orange-500/50 transition">
            <div className="text-4xl font-bold text-orange-500 mb-2">{profile?.win_streak || 0}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Flame className="w-4 h-4" />
              Current Streak
            </div>
          </div>

          <div className="bg-card/95 backdrop-blur border border-border/50 rounded-xl p-6 text-center hover:border-purple-500/50 transition">
            <div className="text-4xl font-bold text-purple-500 mb-2">{profile?.longest_win_streak || 0}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Flame className="w-4 h-4" />
              Longest Streak
            </div>
          </div>

          <div className="bg-card/95 backdrop-blur border border-border/50 rounded-xl p-6 text-center hover:border-cyan-500/50 transition">
            <div className="text-4xl font-bold text-cyan-500 mb-2">{profile?.countries_mastered || 0}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              🌍 Countries Mastered
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-card/95 backdrop-blur border border-border/50 rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            🏆 Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Win Rate Achievement */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-medium text-foreground mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-blue-500">
                {profile?.total_games > 0 ? ((profile.total_wins / profile.total_games) * 100).toFixed(1) : 0}%
              </div>
            </div>

            {/* Games Played Achievement */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">🎮</div>
              <div className="text-sm font-medium text-foreground mb-1">Games Played</div>
              <div className="text-2xl font-bold text-green-500">{profile?.total_games || 0}</div>
            </div>

            {/* Total Wins Achievement */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">🥇</div>
              <div className="text-sm font-medium text-foreground mb-1">Total Wins</div>
              <div className="text-2xl font-bold text-yellow-500">{profile?.total_wins || 0}</div>
            </div>

            {/* Countries Mastered Achievement */}
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">🌍</div>
              <div className="text-sm font-medium text-foreground mb-1">Countries Mastered</div>
              <div className="text-2xl font-bold text-purple-500">{profile?.countries_mastered || 0}</div>
            </div>

            {/* Current Streak Achievement */}
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-sm font-medium text-foreground mb-1">Current Streak</div>
              <div className="text-2xl font-bold text-orange-500">{profile?.win_streak || 0}</div>
            </div>

            {/* Longest Streak Achievement */}
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">🚀</div>
              <div className="text-sm font-medium text-foreground mb-1">Longest Streak</div>
              <div className="text-2xl font-bold text-red-500">{profile?.longest_win_streak || 0}</div>
            </div>

            {/* Total Points Achievement */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-500/20 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-sm font-medium text-foreground mb-1">Total Points</div>
              <div className="text-2xl font-bold text-cyan-500">{profile?.total_points || 0}</div>
            </div>

            {/* Rank Achievement */}
            <div className={`bg-gradient-to-br ${rankInfo.bgColor} border border-primary/20 rounded-lg p-4 text-center`}>
              <div className="text-3xl mb-2">{rankInfo.icon}</div>
              <div className="text-sm font-medium text-foreground mb-1">Current Rank</div>
              <div className={`text-2xl font-bold ${rankInfo.color}`}>{rankInfo.rank}</div>
            </div>
          </div>
        </div>

        {/* Win Rate */}
        {profile?.total_games > 0 && (
          <div className="bg-card/95 backdrop-blur border border-border/50 rounded-xl p-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Win Rate</div>
              <div className="text-5xl font-bold text-primary mb-2">
                {((profile.total_wins / profile.total_games) * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500"
                  style={{ width: `${(profile.total_wins / profile.total_games) * 100}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {profile.total_wins} wins out of {profile.total_games} games
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
