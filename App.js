import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import RanksScreen from './src/screens/RanksScreen';
import AppsScreen from './src/screens/AppsScreen';
import FormationsScreen from './src/screens/FormationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import { COLORS } from './src/constants';
import { subscribeToAuthChanges } from './src/services/authService';
import { getPlayers } from './src/services/playerService';
import { getSquads } from './src/services/squadService';
import { Animated } from 'react-native';

const AnimatedIcon = ({ focused, children }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
};

const Tab = createBottomTabNavigator();

const UserContext = React.createContext();
const PlayersContext = React.createContext();
const SquadsContext = React.createContext();
const SettingsContext = React.createContext();

export const useUser = () => React.useContext(UserContext);
export const usePlayers = () => React.useContext(PlayersContext);
export const useSquads = () => React.useContext(SquadsContext);
export const useSettings = () => React.useContext(SettingsContext);

// Keep the old hook for compatibility but make it aggregate
export const useAppContext = () => {
  const { user } = React.useContext(UserContext);
  const { players, setPlayers } = React.useContext(PlayersContext);
  const { squads, setSquads } = React.useContext(SquadsContext);
  const { settings, setSettings } = React.useContext(SettingsContext);
  return { user, settings, setSettings, players, setPlayers, squads, setSquads };
};

export default function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [players, setPlayers] = React.useState([]);
  const [squads, setSquads] = React.useState([]);
  const [settings, setSettings] = React.useState({
    cardSize: 'sm',
    showLabels: true,
    showRatings: true,
    showStats: true,
    showClub: true,
    showPlaystyle: true,
    showClubBadge: true,
    showNationBadge: true,
    customStatSlots: ['matches', 'goals', 'assists'],
    highPerf: false,
    appLogo: null,
    theme: 'neon',
  });

  React.useEffect(() => {
    const unsubAuth = subscribeToAuthChanges(async (u) => {
      try {
        if (u) {
          setUser({
            uid: u.uid,
            name: u.displayName || (u.email ? u.email.split('@')[0] : 'Guest User'),
            email: u.email || 'Anonymous',
            picture: u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.email || 'Guest')}&background=random`,
          });
          const [playerData, squadData] = await Promise.all([
            getPlayers(u.uid),
            getSquads(u.uid)
          ]);
          setPlayers(playerData);
          setSquads(squadData);
        } else {
          setUser(null);
          setPlayers([]);
          setSquads([]);
        }
      } catch (err) {
        console.error("APP INIT ERROR:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  const userValue = useMemo(() => ({ user }), [user]);
  const playersValue = useMemo(() => ({ players, setPlayers }), [players]);
  const squadsValue = useMemo(() => ({ squads, setSquads }), [squads]);
  const settingsValue = useMemo(() => ({ settings, setSettings }), [settings]);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0c', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '900', letterSpacing: 2 }}>INITIALIZING ENGINE...</Text>
    </View>
  );

  if (!user) return <LoginScreen />;

  return (
    <UserContext.Provider value={userValue}>
      <PlayersContext.Provider value={playersValue}>
        <SquadsContext.Provider value={squadsValue}>
          <SettingsContext.Provider value={settingsValue}>
            <NavigationContainer>
              <StatusBar style="light" hidden={true} translucent />
              <Tab.Navigator
                screenOptions={{
                  headerShown: false,
                  tabBarShowLabel: false,
                  tabBarStyle: {
                    backgroundColor: '#0a0a0c',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(0, 212, 255, 0.1)',
                    height: 75,
                    paddingBottom: 15,
                    paddingTop: 10,
                    display: (user ? 'flex' : 'none'),
                    shadowColor: '#00d4ff',
                    shadowOffset: { width: 0, height: -10 },
                    shadowOpacity: 0.05,
                    shadowRadius: 20,
                  },
                  tabBarActiveTintColor: '#00d4ff',
                  tabBarInactiveTintColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <Tab.Screen
                  name="Squad"
                  component={HomeScreen}
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <View style={{ alignItems: 'center' }}>
                        <AnimatedIcon focused={focused}>
                          <MaterialCommunityIcons
                            name="cards-outline"
                            size={32}
                            color={focused ? '#00d4ff' : 'rgba(255,255,255,0.3)'}
                            style={focused ? {
                              textShadowColor: 'rgba(0, 212, 255, 1)',
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius: 15
                            } : {}}
                          />
                        </AnimatedIcon>
                        <View style={{
                          width: 4, height: 4, borderRadius: 2,
                          backgroundColor: focused ? '#00d4ff' : 'transparent',
                          marginTop: 6,
                          shadowColor: '#00d4ff', shadowRadius: 5, shadowOpacity: 1
                        }} />
                      </View>
                    )
                  }}
                />

                <Tab.Screen
                  name="Ranks"
                  component={RanksScreen}
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <View style={{ alignItems: 'center' }}>
                        <AnimatedIcon focused={focused}>
                          <MaterialCommunityIcons
                            name="chart-timeline-variant-shimmer"
                            size={28}
                            color={focused ? '#bd00ff' : 'rgba(255,255,255,0.3)'}
                            style={focused ? {
                              textShadowColor: 'rgba(189, 0, 255, 1)',
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius: 15
                            } : {}}
                          />
                        </AnimatedIcon>
                        <View style={{
                          width: 4, height: 4, borderRadius: 2,
                          backgroundColor: focused ? '#bd00ff' : 'transparent',
                          marginTop: 6,
                          shadowColor: '#bd00ff', shadowRadius: 5, shadowOpacity: 1
                        }} />
                      </View>
                    )
                  }}
                />

                <Tab.Screen
                  name="Apps"
                  component={AppsScreen}
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <View style={{ alignItems: 'center' }}>
                        <AnimatedIcon focused={focused}>
                          <MaterialCommunityIcons
                            name="apps"
                            size={30}
                            color={focused ? COLORS.accent : 'rgba(255,255,255,0.3)'}
                            style={focused ? {
                              textShadowColor: COLORS.accent,
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius: 15
                            } : {}}
                          />
                        </AnimatedIcon>
                        <View style={{
                          width: 4, height: 4, borderRadius: 2,
                          backgroundColor: focused ? COLORS.accent : 'transparent',
                          marginTop: 6,
                          shadowColor: COLORS.accent, shadowRadius: 5, shadowOpacity: 1
                        }} />
                      </View>
                    )
                  }}
                />

                <Tab.Screen
                  name="Formations"
                  component={FormationsScreen}
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <View style={{ alignItems: 'center' }}>
                        <AnimatedIcon focused={focused}>
                          <MaterialCommunityIcons
                            name="soccer-field"
                            size={30}
                            color={focused ? '#00ffaa' : 'rgba(255,255,255,0.3)'}
                            style={focused ? {
                              textShadowColor: 'rgba(0, 255, 170, 1)',
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius: 15
                            } : {}}
                          />
                        </AnimatedIcon>
                        <View style={{
                          width: 4, height: 4, borderRadius: 2,
                          backgroundColor: focused ? '#00ffaa' : 'transparent',
                          marginTop: 6,
                          shadowColor: '#00ffaa', shadowRadius: 5, shadowOpacity: 1
                        }} />
                      </View>
                    )
                  }}
                />

                <Tab.Screen
                  name="User"
                  component={ProfileScreen}
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <View style={{ alignItems: 'center' }}>
                        <AnimatedIcon focused={focused}>
                          <MaterialCommunityIcons
                            name="account-tie"
                            size={32}
                            color={focused ? '#ffaa00' : 'rgba(255,255,255,0.3)'}
                            style={focused ? {
                              textShadowColor: 'rgba(255, 170, 0, 1)',
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius: 15
                            } : {}}
                          />
                        </AnimatedIcon>
                        <View style={{
                          width: 4, height: 4, borderRadius: 2,
                          backgroundColor: focused ? '#ffaa00' : 'transparent',
                          marginTop: 6,
                          shadowColor: '#ffaa00', shadowRadius: 5, shadowOpacity: 1
                        }} />
                      </View>
                    )
                  }}
                />
              </Tab.Navigator>
            </NavigationContainer>
          </SettingsContext.Provider>
        </SquadsContext.Provider>
      </PlayersContext.Provider>
    </UserContext.Provider>
  );
}
