"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { Toaster, toast } from "sonner";
import {
	TasksIcon,
	FriendsIcon,
	PetIcon,
	SynapseLogo,
	HistoryIcon,
} from "@/components/icons";
import { PetDisplay } from "@/components/pet/PetDisplay";
import { PetStats } from "@/components/pet/PetStats";
import { Shop } from "@/components/pet/Shop";
import { ShopIcon, HappinessIcon } from "@/components/pet/PetIcons";
import { useUserXp } from "@/hooks/useUserXp";
import { usePetData, updatePetCache } from "@/hooks/usePetData";

export default function PetPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const [hoveredButton, setHoveredButton] = useState<string | null>(null);
	const [showShop, setShowShop] = useState(false);
	const userXp = useUserXp();
	const sidebarPetData = usePetData();

	// Pet state
	const [petData, setPetData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!isPending && !session) router.push("/signin");
	}, [session, isPending, router]);

	const authToken = session?.session?.token;

	const fetchPetData = async () => {
			if (!authToken) return;

			setLoading(true);
			try {
				const res = await fetch("/api/pet", {
				headers: { Authorization: `Bearer ${authToken}` },
			});
				if (!res.ok) {
					console.error("Failed to fetch pet data", await res.text());
					return;
				}
				const data = await res.json();
				updatePetCache(authToken, data);
				setPetData(data);
			} catch (err) {
				console.error("Error fetching pet data:", err);
			} finally {
				setLoading(false);
		}
	};

	useEffect(() => {
		fetchPetData();
	}, [authToken]);

	if (isPending && !session) {
		return (
			<div
				style={{
					display: "flex",
					minHeight: "100vh",
					alignItems: "center",
					justifyContent: "center",
					background: "#121212",
					color: "#9ca3af",
					fontSize: "14px",
				}}
			>
				Loading...
			</div>
		);
	}

	if (!session) {
		return null;
	}

	const handlePurchase = async (itemName: string) => {
		if (!authToken) return;

		try {
			const res = await fetch("/api/pet/purchase", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
				body: JSON.stringify({ itemName }),
			});

			if (!res.ok) {
				const error = await res.json();
				toast.error(error.error || "Purchase failed");
				return;
			}

			toast.success("Item purchased!");
			await fetchPetData();
		} catch (err) {
			toast.error("Failed to purchase item");
		}
	};

	const userInitial = useMemo(
		() =>
			(
				session?.user?.name?.[0] ||
				session?.user?.email?.[0] ||
				"U"
			).toUpperCase(),
		[session?.user],
	);

  return (
    <>
      <Toaster position="top-center" richColors />
      <div
        style={{
          minHeight: "100vh",
          background: "#121212",
          color: "#eeeeee",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            width: 260,
            background: "#121212",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
          }}
        >
          {/* Logo */}
          <div style={{ padding: "24px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <SynapseLogo />
              <span style={{ fontSize: 22, fontWeight: 700, color: "#eeeeee" }}>
                Synapse
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav
            style={{
              flex: 1,
              padding: "20px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <Link
              href="/tasks"
              onMouseEnter={() => setHoveredButton("tasks")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 8,
                textDecoration: "none",
                background: hoveredButton === "tasks" ? "#1a1a1a" : "transparent",
                color: "#9ca3af",
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all .2s ease",
                textAlign: "left",
              }}
            >
              <TasksIcon active={false} />
              Tasks
            </Link>

            <Link
              href="/friends"
              onMouseEnter={() => setHoveredButton("friends")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 8,
                textDecoration: "none",
                background: hoveredButton === "friends" ? "#1a1a1a" : "transparent",
                color: "#9ca3af",
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all .2s ease",
                textAlign: "left",
              }}
            >
              <FriendsIcon active={false} />
              Friends
            </Link>

            {/* Active: Pet */}
            <Link
              href="/pet"
              aria-current="page"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 8,
                textDecoration: "none",
                background: "#1a1a1a",
                color: "#eeeeee",
                fontSize: 15,
                fontWeight: 500,
                textAlign: "left",
                cursor: "default",
              }}
            >
              <PetIcon active />
              Pet
            </Link>
            <Link
              href="/history"
              onMouseEnter={() => setHoveredButton("history")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "8px",
                textDecoration: "none",
                background:
                  hoveredButton === "history" ? "#1a1a1a" : "transparent",
                color: "#9ca3af",
                fontSize: "15px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
              }}
            >
              <HistoryIcon active={false} />
              History
            </Link>
          </nav>

          {/* Pet Section */}
          {sidebarPetData && (
            <div
              style={{
                margin: "12px",
                padding: "20px 16px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)",
                border: "1px solid #3a3a3a",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <PetDisplay
                  equippedItems={sidebarPetData.equippedItems || []}
                  stage={sidebarPetData.stage}
                  size={140}
                />
              </div>

              {/* Happiness Bar */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#9ca3af",
                    }}
                  >
                    Happiness
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <HappinessIcon
                      happiness={sidebarPetData.happiness}
                      size={14}
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#eeeeee",
                      }}
                    >
                      {sidebarPetData.happiness}/100
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "#1a1a1a",
                    borderRadius: "999px",
                    overflow: "hidden",
                    border: "1px solid #2a2a2a",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${sidebarPetData.happiness}%`,
                      background:
                        sidebarPetData.happiness >= 66
                          ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                          : sidebarPetData.happiness >= 33
                            ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
                            : "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                      borderRadius: "999px",
                      transition: "all 0.5s ease",
                    }}
                  />
                </div>
              </div>

              {/* Level & XP Info */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#1a1a1a",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <span style={{ color: "#9ca3af" }}>Level </span>
                  <span style={{ color: "#eeeeee", fontWeight: "600" }}>
                    {sidebarPetData.level}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#a5b4fc", fontWeight: "600" }}>
                    {sidebarPetData.currentXP}/{sidebarPetData.maxXP} XP
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* User */}
          <div style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "#4972e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {userInitial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#eee",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {session.user.name || "User"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#888",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  @{(session.user as any).username || "username"}
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#a5b4fc",
                  whiteSpace: "nowrap",
                }}
              >
                {userXp} XP
              </div>
            </div>
            <button
              onClick={async () => {
                await signOut();
                router.push("/signin");
              }}
              onMouseEnter={() => setHoveredButton("signout")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: 6,
                border: "none",
                background: hoveredButton === "signout" ? "#7f1d1d" : "#991b1b",
                color: "#fca5a5",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all .2s ease",
              }}
            >
              Sign Out
            </button>
          </div>
        </aside>

				{/* Main */}
				<main style={{ marginLeft: 260, flex: 1, padding: 16, width: "100%" }}>
					<div
						style={{
							background: "#161616",
							borderRadius: 24,
							padding: "20px 28px",
							minHeight: "calc(100vh - 32px)",
						}}
					>
						<h1
							style={{
								fontSize: 32,
								fontWeight: 700,
								color: "#eee",
								marginBottom: 24,
							}}
						>
							My Pet
						</h1>

						{loading ? (
							<div
								style={{
									textAlign: "center",
									padding: "48px",
									color: "#9ca3af",
								}}
							>
								Loading pet data...
							</div>
						) : petData ? (
							<>
								{/* Pet Stats */}
								<PetStats
									level={petData.level}
									currentXP={petData.currentXP}
									maxXP={petData.maxXP}
									percentage={petData.percentage}
									coins={petData.coins}
									stage={petData.stage}
								/>

								{/* Pet Display */}
								<div
									style={{
										background: "#161616",
										borderRadius: "16px",
										padding: "0px",
										marginBottom: "48px",
									}}
								>
									<PetDisplay
										equippedItems={petData.equippedItems || []}
										stage={petData.stage}
										size={350}
									/>

									{/* Happiness Bar */}
									<div
										style={{
											marginTop: "24px",
											maxWidth: "350px",
											margin: "24px auto 0",
										}}
									>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												marginBottom: "8px",
											}}
										>
											<span
												style={{
													fontSize: "13px",
													fontWeight: "500",
													color: "#9ca3af",
												}}
											>
												Happiness
											</span>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "6px",
												}}
											>
												<HappinessIcon happiness={petData.happiness} size={18} />
												<span
													style={{
														fontSize: "13px",
														fontWeight: "600",
														color: "#eeeeee",
													}}
												>
													{petData.happiness}/100
												</span>
											</div>
										</div>
										<div
											style={{
												width: "100%",
												height: "10px",
												background: "#1a1a1a",
												borderRadius: "999px",
												overflow: "hidden",
												position: "relative",
												border: "1px solid #2a2a2a",
											}}
										>
											<div
												style={{
													height: "100%",
													width: `${petData.happiness}%`,
													background:
														petData.happiness >= 66
															? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
															: petData.happiness >= 33
																? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
																: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
													borderRadius: "999px",
													transition: "all 0.5s ease",
													position: "relative",
												}}
											>
												{/* Shine effect */}
												<div
													style={{
														position: "absolute",
														top: 0,
														left: 0,
														right: 0,
														bottom: 0,
														background:
															"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
														animation: "shine 2s ease-in-out infinite",
													}}
												/>
											</div>
										</div>
									</div>
								</div>

								{/* Action Buttons */}
								<div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
									<button
										onClick={() => setShowShop(true)}
										style={{
											padding: "14px 32px",
											borderRadius: "8px",
											border: "none",
											background: "#fbbf24",
											color: "#1a1a1a",
											fontSize: "16px",
											fontWeight: "600",
											cursor: "pointer",
											transition: "all 0.2s ease",
											display: "flex",
											alignItems: "center",
											gap: "8px",
										}}
									>
										<ShopIcon size={20} />
										<span>Open Shop</span>
									</button>
								</div>

								{/* Shop Modal */}
								{showShop && (
									<Shop
										coins={petData.coins}
										equippedItems={petData.equippedItems || []}
										onPurchase={handlePurchase}
										onClose={() => setShowShop(false)}
									/>
								)}
							</>
						) : (
							<div
								style={{
									textAlign: "center",
									padding: "48px",
									color: "#9ca3af",
								}}
							>
								Failed to load pet data
							</div>
						)}
					</div>
				</main>
      </div>
    </>
  );
}
