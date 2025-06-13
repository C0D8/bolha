"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FaCamera } from "react-icons/fa";

type User = {
  username: string;
  clerk_id: string;
};

type Follower = {
  id?: string;
  username: string;
  clerk_id: string;
};

const ProfilePage: React.FC = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const clerkId = user?.id || "";
  const [userPerfil, setUser] = useState<User | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!clerkId || !isLoaded) {
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const userRes = await fetch(`/api/users/${clerkId}`);
        const userData = await userRes.json();
        if (!userRes.ok) {
          throw new Error(userData.error || "Erro ao buscar usuário");
        }
        setUser(userData);

        const followersRes = await fetch(`/api/users/${clerkId}/followers`);
        const followersData = await followersRes.json();
        if (!followersRes.ok) {
          throw new Error(followersData.error || "Erro ao buscar seguidores");
        }
        setFollowers(followersData.followers || []);

        const followingRes = await fetch(`/api/users/${clerkId}/following`);
        const followingData = await followingRes.json();
        if (!followingRes.ok) {
          throw new Error(followingData.error || "Erro ao buscar seguindo");
        }
        setFollowing(followingData.following || []);

        setIsFollowing(
          Array.isArray(followersData.followers) &&
            followersData.followers.some((f: Follower) => f.clerk_id === user?.id)
        );
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [clerkId, user, isLoaded]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (!clerkId || !user) {
        console.error("IDs de usuário inválidos");
        return;
      }
      const res = await fetch(`/api/users/${clerkId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clerk_id: user.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao seguir usuário");
      }

      setIsFollowing(true);
      const followersRes = await fetch(`/api/users/${clerkId}/followers`);
      const followersData = await followersRes.json();
      if (followersRes.ok) {
        setFollowers(followersData.followers || []);
      }
    } catch (err) {
      console.error("Erro ao seguir:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCameraClick = () => {
    router.push("/midia-pipe");
  };

  if (loading) return <div>Carregando...</div>;
  if (!userPerfil || !clerkId) return <div>Usuário não encontrado.</div>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24, position: "relative", height: "90vh" }}>
      <h1>Perfil de {userPerfil.username}</h1>
      <p>
        <strong>ID:</strong> {userPerfil.clerk_id}
      </p>
      {isLoaded && user?.id !== clerkId && (
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
        {followers.map((f) => (
          <li key={f.clerk_id}>{f.username}</li>
        ))}
      </ul>
      <h2>Seguindo ({following.length})</h2>
      <ul>
        {following.map((f) => (
          <li key={f.clerk_id}>{f.username}</li>
        ))}
      </ul>

      <button
        onClick={handleCameraClick}
        style={{
          position: "absolute",
          bottom: 60, // Ajustado para ficar mais baixo
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: 50,
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
        }}
        title="Ir para Midia Pipe"
      >
        <FaCamera size={24} />
      </button>
    </div>
  );
};

export default ProfilePage;