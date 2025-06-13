import React, { useEffect, useState } from "react";

type User = {
  username: string;
  clerk_id: string;
};

type Follower = {
  username: string;
  clerk_id: string;
};

interface ProfileProps {
  clerkId: string; // ID do perfil sendo visitado
  loggedClerkId: string; // ID do usuário logado
}

const API_URL = "http://localhost:8000"; // ajuste se necessário

const ProfilePage: React.FC<ProfileProps> = ({ clerkId, loggedClerkId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const userRes = await fetch(`${API_URL}/users/${clerkId}`);
        const userData = await userRes.json();
        setUser(userData);

        const followersRes = await fetch(`${API_URL}/users/${clerkId}/followers`);
        const followersData = await followersRes.json();
        setFollowers(followersData);

        const followingRes = await fetch(`${API_URL}/users/${clerkId}/following`);
        setFollowing(await followingRes.json());

        // Verifica se o usuário logado já segue o perfil
        setIsFollowing(followersData.some((f: Follower) => f.clerk_id === loggedClerkId));
      } catch (err) {
        setUser(null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [clerkId, loggedClerkId]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const formData = new FormData();
      formData.append("clerk_id", loggedClerkId);

      const res = await fetch(`${API_URL}/users/${clerkId}/follow`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setIsFollowing(true);
        // Atualiza seguidores
        const followersRes = await fetch(`${API_URL}/users/${clerkId}/followers`);
        setFollowers(await followersRes.json());
      }
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!user) return <div>Usuário não encontrado.</div>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h1>Perfil de {user.username}</h1>
      <p><b>ID:</b> {user.clerk_id}</p>
      {loggedClerkId !== clerkId && (
        <button
          onClick={handleFollow}
          disabled={isFollowing || followLoading}
          style={{ marginBottom: 16 }}
        >
          {isFollowing ? "Seguindo" : followLoading ? "Seguindo..." : "Seguir"}
        </button>
      )}
      <hr />
      <h2>Seguidores ({followers.length})</h2>
      <ul>
        {followers.map(f => (
          <li key={f.clerk_id}>{f.username}</li>
        ))}
      </ul>
      <h2>Seguindo ({following.length})</h2>
      <ul>
        {following.map(f => (
          <li key={f.clerk_id}>{f.username}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProfilePage;