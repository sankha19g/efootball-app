import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import RanksScreen from './src/screens/RanksScreen';
import FormationsScreen from './src/screens/FormationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import { COLORS } from './src/constants';
import { subscribeToAuthChanges } from './src/services/authService';
import { getPlayers } from './src/services/playerService';

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [players, setPlayers] = React.useState([]);
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
  });

  React.useEffect(() => {
    const unsubAuth = subscribeToAuthChanges(async (u) => {
      if (u) {
        setUser({
          uid: u.uid,
          name: u.displayName || u.email.split('@')[0],
          email: u.email,
          picture: u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.email)}&background=random`,
        });
        
        // Fetch players after auth
        try {
          const squad = await getPlayers(u.uid);
          setPlayers(squad);
        } catch (err) {
          console.error("Error fetching squad:", err);
        }
      } else {
        setUser(null);
        setPlayers([]);
      }
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0c', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '900', letterSpacing: 2 }}>INITIALIZING ENGINE...</Text>
    </View>
  );

  if (!user) return <LoginScreen />;

  return (
    <NavigationContainer>
      <StatusBar hidden={true} translucent />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: '#111116',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.05)',
            height: 65,
            paddingBottom: 0,
            display: (user ? 'flex' : 'none'),
          },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 10,
          },
        }}
      >
        <Tab.Screen 
          name="Squad" 
          options={{ 
            title: 'SQUAD',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🛡️</Text>
          }} 
        >
          {props => <HomeScreen {...props} user={user} settings={settings} setSettings={setSettings} players={players} setPlayers={setPlayers} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Ranks" 
          options={{ 
            title: 'RANKS',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏆</Text>
          }} 
        >
          {props => <RanksScreen {...props} user={user} players={players} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Formations" 
          options={{ 
            title: 'FORMATIONS',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📋</Text>
          }} 
        >
          {props => <FormationsScreen {...props} user={user} players={players} />}
        </Tab.Screen>
        <Tab.Screen 
          name="User" 
          options={{ 
            title: 'USER',
            tabBarIcon: ({ focused }) => (
              <View style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 16, 
                borderWidth: focused ? 2 : 1, 
                borderColor: focused ? COLORS.accent : 'rgba(255,255,255,0.2)',
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.05)'
              }}>
                <Image source={{ uri: user.picture }} style={{ width: '100%', height: '100%' }} />
              </View>
            )
          }}
        >
          {props => <ProfileScreen {...props} user={user} settings={settings} setSettings={setSettings} players={players} setPlayers={setPlayers} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
