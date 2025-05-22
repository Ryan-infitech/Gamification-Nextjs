'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameCanvas from '@/components/game/GameCanvas';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import Image from 'next/image';
import {
  Gamepad,
  MapPin,
  Info,
  Trophy,
  User,
  Heart,
  Brain,
  Zap,
  HelpCircle,
  MessageCircle,
  List,
  ArrowLeftRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UnauthenticatedOnly } from '@/components/auth/RoleBasedAccess';
import { useToast } from '@/hooks/useToast';
import MainLayout from '@/components/layout/MainLayout';
import MetaTags from '@/components/common/MetaTags';

/**
 * Halaman utama game dengan Next.js App Router
 */
const GamePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('game');
  const [isFullWidth, setIsFullWidth] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Debug mode hanya di development
  const isDebugMode = process.env.NODE_ENV === 'development';

  // Handle request fullscreen
  const handleFullWidth = () => {
    setIsFullWidth(!isFullWidth);
  };

  // Komponen login notice untuk user yang belum login
  const LoginNotice = () => (
    <Card className="border-2 border-warning/30 bg-warning/5">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="bg-warning/20 p-4 rounded-full">
            <HelpCircle className="h-8 w-8 text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="font-pixel-heading text-lg mb-2">Login Required</h3>
            <p className="text-muted-foreground font-pixel-body mb-4">
              You need to log in to play the game and access your progress.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Button asChild className="font-pixel-body">
                <a href="/login">Login</a>
              </Button>
              <Button variant="outline" asChild className="font-pixel-body">
                <a href="/register">Register</a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Animation variants for elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  // Player stats mock
  const playerStats = {
    level: user?.level || 1,
    experience: user?.experience || 0,
    health: 100,
    strength: 10,
    intelligence: 10,
    agility: 10,
    items: [
      { id: 'item1', name: 'Health Potion', quantity: 3, icon: '/assets/game/ui/health-potion.png' },
      { id: 'item2', name: 'Coding Manual', quantity: 1, icon: '/assets/game/ui/book.png' },
    ],
    quests: [
      { id: 'quest1', name: 'Intro to Variables', status: 'active', progress: 30 },
      { id: 'quest2', name: 'Loop Challenge', status: 'active', progress: 0 },
    ],
  };

  return (
    <MainLayout>
      <MetaTags
        title="Game World - Gamifikasi CS"
        description="Explore the interactive game world of Gamifikasi CS, solve coding challenges, and level up your programming skills."
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={`container mx-auto px-4 py-8 ${isFullWidth ? 'max-w-none' : ''}`}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          {/* Main Content */}
          <motion.div
            variants={itemVariants}
            className={`${
              isFullWidth ? 'w-full' : 'lg:w-2/3'
            } space-y-6`}
          >
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-pixel-heading text-gradient">Game World</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFullWidth}
                className="font-pixel-body"
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                {isFullWidth ? 'Normal View' : 'Full Width'}
              </Button>
            </div>

            <UnauthenticatedOnly fallback={<GameCanvas debug={isDebugMode} />}>
              <LoginNotice />
            </UnauthenticatedOnly>
          </motion.div>

          {/* Sidebar - Hidden in full width mode */}
          {!isFullWidth && (
            <motion.div
              variants={itemVariants}
              className="lg:w-1/3 space-y-6"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="game" className="font-pixel-body">
                    <Gamepad className="h-4 w-4 mr-2" />
                    Game
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="font-pixel-body">
                    <User className="h-4 w-4 mr-2" />
                    Stats
                  </TabsTrigger>
                  <TabsTrigger value="map" className="font-pixel-body">
                    <MapPin className="h-4 w-4 mr-2" />
                    Map
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="game" className="space-y-4 py-4">
                  {isAuthenticated ? (
                    <>
                      <Card className="border-2">
                        <CardContent className="pt-6">
                          <h3 className="font-pixel-heading text-lg mb-2">Current Quests</h3>
                          <div className="space-y-3">
                            {playerStats.quests.map((quest) => (
                              <div key={quest.id} className="border border-border rounded-md p-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-pixel-body">{quest.name}</span>
                                  <Badge variant="outline">{quest.status}</Badge>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${quest.progress}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            className="w-full mt-4 font-pixel-body"
                            onClick={() => toast({ title: "Quests Feature Coming Soon", variant: "default" })}
                          >
                            <List className="h-4 w-4 mr-2" />
                            View All Quests
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardContent className="pt-6">
                          <h3 className="font-pixel-heading text-lg mb-2">Inventory</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {playerStats.items.map((item) => (
                              <div
                                key={item.id}
                                className="border border-border rounded-md p-2 flex items-center gap-2"
                              >
                                <div className="h-8 w-8 bg-muted rounded-md flex items-center justify-center">
                                  <Image
                                    src={item.icon}
                                    alt={item.name}
                                    width={24}
                                    height={24}
                                  />
                                </div>
                                <div className="text-sm">
                                  <div className="font-pixel-body">{item.name}</div>
                                  <div className="text-xs text-muted-foreground font-pixel-body">
                                    x{item.quantity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card className="border-2">
                      <CardContent className="py-6 text-center">
                        <Info className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <h3 className="font-pixel-heading text-lg mb-2">Game Information</h3>
                        <p className="text-muted-foreground font-pixel-body mb-4">
                          Explore the world, solve coding challenges, and level up your programming skills!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="stats" className="space-y-4 py-4">
                  {isAuthenticated ? (
                    <Card className="border-2">
                      <CardContent className="pt-6 pb-6">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="font-pixel-heading text-lg">{user?.username || 'Player'}</h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground font-pixel-body">
                              <Trophy className="h-3 w-3" />
                              Level {playerStats.level}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-pixel-body">XP</div>
                            <div className="text-lg font-pixel-heading">{playerStats.experience}</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-pixel-body flex items-center">
                                <Heart className="h-4 w-4 mr-1 text-danger" /> Health
                              </span>
                              <span className="text-sm font-pixel-body">{playerStats.health}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-danger transition-all"
                                style={{ width: `${(playerStats.health / 100) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-pixel-body flex items-center">
                                <Zap className="h-4 w-4 mr-1 text-warning" /> Strength
                              </span>
                              <span className="text-sm font-pixel-body">{playerStats.strength}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-warning transition-all"
                                style={{ width: `${(playerStats.strength / 20) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-pixel-body flex items-center">
                                <Brain className="h-4 w-4 mr-1 text-primary" /> Intelligence
                              </span>
                              <span className="text-sm font-pixel-body">{playerStats.intelligence}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${(playerStats.intelligence / 20) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-pixel-body flex items-center">
                                <ArrowLeftRight className="h-4 w-4 mr-1 text-accent" /> Agility
                              </span>
                              <span className="text-sm font-pixel-body">{playerStats.agility}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent transition-all"
                                style={{ width: `${(playerStats.agility / 20) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-2">
                      <CardContent className="py-6 text-center">
                        <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <h3 className="font-pixel-heading text-lg mb-2">Player Stats</h3>
                        <p className="text-muted-foreground font-pixel-body mb-4">
                          Login to view and track your character stats, level progress, and achievements.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="map" className="space-y-4 py-4">
                  <Card className="border-2">
                    <CardContent className="pt-6 text-center">
                      <div className="border-2 border-border rounded-md p-2 bg-muted/50 mb-4">
                        <Image
                          src="/assets/game/maps/map-preview.png"
                          alt="World Map"
                          width={300}
                          height={300}
                          className="w-full h-auto"
                        />
                      </div>
                      <h3 className="font-pixel-heading text-lg mb-2">World Map</h3>
                      <p className="text-muted-foreground font-pixel-body mb-4">
                        Explore different areas to find challenges, quests, and other players.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="text-left border border-border rounded-md p-2">
                          <div className="text-sm font-pixel-heading mb-1">Tutorial Area</div>
                          <div className="text-xs text-muted-foreground font-pixel-body">
                            Level 1-5 • Beginner
                          </div>
                        </div>
                        <div className="text-left border border-border rounded-md p-2">
                          <div className="text-sm font-pixel-heading mb-1">Algorithm Forest</div>
                          <div className="text-xs text-muted-foreground font-pixel-body">
                            Level 5-10 • Intermediate
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Help section */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-pixel-heading text-base mb-1">Need Help?</h3>
                      <p className="text-sm text-muted-foreground font-pixel-body mb-3">
                        Check our game guide or ask in the community forum.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-pixel-body"
                        onClick={() => toast({ 
                          title: "Game guide opening soon!", 
                          description: "Our comprehensive guide is being developed.",
                          variant: "default" 
                        })}
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        View Game Guide
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default GamePage;
