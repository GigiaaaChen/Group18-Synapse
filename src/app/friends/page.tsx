"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { toast, Toaster } from "sonner";
import { TasksIcon, FriendsIcon, SynapseLogo } from "@/components/icons";

interface Friend {
  friendshipId: number;
  id: string;
  name: string;
  username: string;
  email: string;
  xp: number;
  petHappiness: number;
}

interface FriendRequest {
  friendshipId: number;
  id: string;
  name: string;
  username: string;
  email: string;
  createdAt: string;
}

interface SearchResult {
  id: string;
  name: string;
  username: string;
  xp: number;
  petHappiness: number;
}

export default function FriendsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingFriends, setPendingFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [userXp, setUserXp] = useState((session?.user as any)?.xp ?? 0);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      setUserXp((session.user as any)?.xp ?? 0);
    }
  }, [session]);

  const authToken = session?.session?.token;

  useEffect(() => {
    if (searchUsername.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!authToken) return;
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/friends/search?q=${encodeURIComponent(searchUsername)}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Failed to search users", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchUsername, authToken]);

  useEffect(() => {
    if (!authToken) return;
    fetchFriends();
    fetchFriendRequests();
  }, [authToken]);

  const fetchFriends = async () => {
    if (!authToken) return;
    try {
      const response = await fetch("/api/friends", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (err) {
      console.error("Failed to fetch friends", err);
    }

    try {
      const pendingResponse = await fetch("/api/friends/pending", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingFriends(pendingData);
      }
    } catch (err) {
      console.error("Failed to fetch pending friends", err);
    }
  };

  const fetchFriendRequests = async () => {
    if (!authToken) return;
    try {
      const response = await fetch("/api/friends/requests", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data);
      }
    } catch (err) {
      console.error("Failed to fetch friend requests", err);
    }
  };

  const handleSendRequest = async (username: string) => {
    if (!username || !authToken) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        toast.success("Friend request sent!");
        setSearchUsername("");
        setSearchResults([]);
        fetchFriends();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send friend request");
      }
    } catch (err) {
      toast.error("Failed to send friend request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (friendshipId: number) => {
    if (!authToken) return;
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action: "accept" }),
      });

      if (response.ok) {
        fetchFriends();
        fetchFriendRequests();
        toast.success("Friend request accepted!");
      } else {
        toast.error("Failed to accept friend request");
      }
    } catch (err) {
      toast.error("Failed to accept friend request");
    }
  };

  const handleDeclineRequest = async (friendshipId: number) => {
    if (!authToken) return;
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action: "decline" }),
      });

      if (response.ok) {
        fetchFriendRequests();
        toast.success("Friend request declined");
      } else {
        toast.error("Failed to decline friend request");
      }
    } catch (err) {
      toast.error("Failed to decline friend request");
    }
  };

  const handleRemoveFriend = async (friendshipId: number, friendName: string) => {
    if (!authToken) return;

    toast.custom(
      (t) => (
        <div style={{
          background: '#161616',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          minWidth: '300px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#eeeeee',
            marginBottom: '8px'
          }}>
            Remove Friend
          </div>
          <div style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginBottom: '20px'
          }}>
            Remove {friendName} from your friends?
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => toast.dismiss(t)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #2a2a2a',
                background: 'transparent',
                color: '#9ca3af',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t);
                try {
                  const response = await fetch(`/api/friends/${friendshipId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${authToken}` },
                  });

                  if (response.ok) {
                    fetchFriends();
                    toast.success("Friend removed");
                  } else {
                    toast.error("Failed to remove friend");
                  }
                } catch (err) {
                  toast.error("Failed to remove friend");
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  const getPetStage = (happiness: number) => {
    if (happiness >= 80) return "😊 Happy";
    if (happiness >= 50) return "😐 Neutral";
    if (happiness >= 20) return "😢 Sad";
    return "💀 Critical";
  };

  if (isPending) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#121212',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div style={{
        minHeight: '100vh',
        background: '#121212',
        color: '#eeeeee',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex'
      }}>
        {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: '#121212',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SynapseLogo />
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#eeeeee' }}>
              Synapse
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{
          flex: 1,
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <button
            onClick={() => router.push('/tasks')}
            onMouseEnter={() => setHoveredButton('tasks')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: hoveredButton === 'tasks' ? '#1a1a1a' : 'transparent',
              color: '#9ca3af',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <TasksIcon active={false} />
            Tasks
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#1a1a1a',
              color: '#eeeeee',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <FriendsIcon active={true} />
            Friends
          </button>
        </nav>

        {/* User Section */}
        <div style={{
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#4972e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff'
            }}>
              {(session.user.name?.[0] || session.user.email?.[0] || 'U').toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#eeeeee',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {session.user.name || 'User'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#888888',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                @{(session.user as any).username || 'username'}
              </div>
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#a5b4fc',
              whiteSpace: 'nowrap'
            }}>
              {userXp} XP
            </div>
          </div>
          <button
            onClick={handleSignOut}
            onMouseEnter={() => setHoveredButton('signout')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: hoveredButton === 'signout' ? '#7f1d1d' : '#991b1b',
              color: '#fca5a5',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main style={{
        marginLeft: '260px',
        flex: 1,
        padding: '16px',
        width: '100%'
      }}>
        <div style={{
          background: '#161616',
          borderRadius: '24px',
          padding: '20px 28px',
          minHeight: 'calc(100vh - 32px)'
        }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#eeeeee',
          marginBottom: '32px'
        }}>
          Friends
        </h1>

        {error && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#6ee7b7',
            fontSize: '14px'
          }}>
            {successMessage}
          </div>
        )}

        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#eeeeee',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Add Friend
          </h2>
          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '8px',
                border: '1px solid #2a2a2a',
                background: '#161616',
                color: '#eeeeee',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                setTimeout(() => {
                  e.target.style.borderColor = '#2a2a2a';
                  e.target.style.boxShadow = 'none';
                }, 200);
              }}
            />

            {searchUsername.length >= 2 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 10,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
              }}>
                {isSearching ? (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '14px'
                  }}>
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '14px'
                  }}>
                    No users found
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <div
                      key={result.id}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1a1a1a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      style={{
                        padding: '16px',
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid #2a2a2a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#4972e1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#ffffff'
                        }}>
                          {result.name[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '15px',
                            fontWeight: '500',
                            color: '#eeeeee',
                            marginBottom: '4px'
                          }}>
                            {result.name}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#888888',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <span>@{result.username}</span>
                            <span>•</span>
                            <span>{result.xp} XP</span>
                            <span>•</span>
                            <span>{getPetStage(result.petHappiness)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendRequest(result.username)}
                        disabled={isLoading}
                        onMouseEnter={() => setHoveredButton(`add-${result.id}`)}
                        onMouseLeave={() => setHoveredButton(null)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          background: hoveredButton === `add-${result.id}` ? '#91aaed' : '#4972e1',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: isLoading ? 0.6 : 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Add Friend
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {friendRequests.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#eeeeee',
              marginBottom: '20px'
            }}>
              Friend Requests ({friendRequests.length})
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {friendRequests.map((request) => (
                <div
                  key={request.friendshipId}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid #2a2a2a',
                    background: '#161616',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#eeeeee' }}>
                      {request.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#888888' }}>
                      @{request.username}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAcceptRequest(request.friendshipId)}
                      onMouseEnter={() => setHoveredButton(`accept-${request.friendshipId}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: hoveredButton === `accept-${request.friendshipId}` ? '#059669' : '#10b981',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.friendshipId)}
                      onMouseEnter={() => setHoveredButton(`decline-${request.friendshipId}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #2a2a2a',
                        background: hoveredButton === `decline-${request.friendshipId}` ? '#1a1a1a' : 'transparent',
                        color: '#9ca3af',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingFriends.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#eeeeee',
              marginBottom: '20px'
            }}>
              Pending Requests ({pendingFriends.length})
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {pendingFriends.map((friend) => (
                <div
                  key={friend.friendshipId}
                  style={{
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #2a2a2a',
                    background: '#161616',
                    opacity: 0.7
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: '#4972e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#ffffff'
                    }}>
                      {friend.name[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#eeeeee',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {friend.name}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#888888',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        @{friend.username}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#1a1a1a',
                    textAlign: 'center',
                    color: '#f59e0b',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Request Pending
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#eeeeee',
            marginBottom: '20px'
          }}>
            My Friends ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              borderRadius: '12px',
              border: '1px solid #2a2a2a',
              background: '#161616',
              color: '#9ca3af'
            }}>
              No friends yet. Add some friends to see their progress!
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {friends.map((friend) => (
                <div
                  key={friend.friendshipId}
                  style={{
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #2a2a2a',
                    background: '#161616',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a2a';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: '#4972e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#ffffff'
                    }}>
                      {friend.name[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#eeeeee',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {friend.name}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#888888',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        @{friend.username}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '8px',
                      background: '#1a1a1a'
                    }}>
                      <span style={{ fontSize: '14px', color: '#9ca3af' }}>XP</span>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#eeeeee' }}>
                        {friend.xp}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '8px',
                      background: '#1a1a1a'
                    }}>
                      <span style={{ fontSize: '14px', color: '#9ca3af' }}>Pet Status</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#eeeeee' }}>
                        {getPetStage(friend.petHappiness)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFriend(friend.friendshipId, friend.name)}
                    onMouseEnter={() => setHoveredButton(`remove-${friend.friendshipId}`)}
                    onMouseLeave={() => setHoveredButton(null)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #2a2a2a',
                      background: hoveredButton === `remove-${friend.friendshipId}` ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                      color: hoveredButton === `remove-${friend.friendshipId}` ? '#fca5a5' : '#9ca3af',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Remove Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
    </>
  );
}
